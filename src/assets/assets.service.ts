import { Injectable, HttpService, Inject } from '@nestjs/common';
import { Model, model } from 'mongoose';
import * as fs from 'fs-extra';
import { Constants } from '../constants';
import { getFileList, fetchFile, splitToSections, attachRemarks, updateDoc } from './operations/update.operation';
import { CmUpdateDto, CmFileInfoDto } from './dto/communication.dto';
import { CreateFileMetaDto, CreateFileDto } from './dto/assets.dto';
import { SectionSchema } from './assetsdb.schema';
import { DBFileMeta, DBFile, DBSection, DBFileModel } from './interface/assets.interface';


@Injectable()
export class AssetsService {
    constructor(
        private readonly httpService: HttpService,
        @Inject(Constants.FileMetaModelToken) private readonly fileMetaModel: Model<DBFileMeta>,
        @Inject(Constants.FilesModelToken) private readonly filesModel: DBFileModel,
    ) { }
    async getFile() { }
    async submitWork() { }
    async getFilesInfo() {
        const metas = await this.fileMetaModel.find({ title: { $ne: 'file-list' } }).exec();
    }
    async updateWeekly(updateCommand: CmUpdateDto) {
        const fileListMeta = await this.fileMetaModel.findOne({ title: 'file-list' }).exec();
        // here toObject() just to avoid warning from ts that type object has no attribute 'Version'.
        if (fileListMeta.toObject().filePaths.Version === updateCommand.fileListMark) {
            return Promise.resolve('No need to update');
        }
        const date = new Date();
        const timestamp = date.toLocaleString();

        const fileList: Map<string, string> = await getFileList(updateCommand.fileListMark, this.httpService);
        const filesMeta = await this.fileMetaModel.find({ title: { $ne: 'file-list' } }).exec();
        let completed = true;

        for (const meta of filesMeta) {
            const updatingMeta = new CreateFileMetaDto(meta.title, meta.nameRegex, meta.desc, meta.reincarnation);
            for (const [fileName, filePath] of fileList.entries()) {
                const reg = new RegExp(meta.nameRegex);
                if (reg.test(fileName) && meta.filePaths[fileName] !== filePath) {
                    updatingMeta.filePaths[fileName] = filePath;
                }
            }
            for (const file of Object.keys(updatingMeta.filePaths)) {
                try {
                    await fetchFile(file, updatingMeta.filePaths[file], this.httpService)
                        .then(rawTexts => rawTexts.map(t => splitToSections(t)), err => { throw err; })
                        .then(rawSections => rawSections.map(t => attachRemarks(meta.title, t, updateCommand.remarks)))
                        .then(rawSections => rawSections.map(t => new CreateFileDto(t, meta)))
                        .then(files => files.map(f => updateDoc(f, meta, this.filesModel, timestamp)))
                        .then(async docInfosPromise => {
                            try {
                                for (const docInfoPromise of docInfosPromise) {
                                    const docInfo = await docInfoPromise;
                                    meta.updateInfo(docInfo);
                                }
                                meta.filePaths[file] = updatingMeta.filePaths[file];
                                console.log('finished ', file);
                                return Promise.resolve('Ok');
                            } catch (err) {
                                return Promise.reject(err);
                            }
                        })
                        .catch(err => {
                            fs.appendFile('update.err',
                                `Failed in updating doc from ${file}, path ${updatingMeta.filePaths[file]}, [${timestamp}]\r\n`,
                                { flag: 'a+' });
                            return Promise.reject(err);
                        });
                } catch (err) {
                    completed = false;
                    console.log('Failed in update meta:\n', err);
                }
            }
            meta.markModified('filePaths');
            meta.save();
        }
        // update file list version only if all files updated
        if (completed) {
            console.log('compeleted!');
            // fileListMeta.set({
            //     filePaths: {
            //         Version: updateCommand.fileListMark,
            //     },
            // });
            //fileListMeta.save();
        }

        return Promise.resolve('Ok');
    }

    async PackTranslations() { }
}
