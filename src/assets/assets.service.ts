import { Injectable, HttpService, Inject } from '@nestjs/common';
import { Model, model } from 'mongoose';
import { Constants } from '../constants';
import { getFileList, fetchFiles, splitToSections } from './operations/update.operation';
import { UpdateCommandDto, FileInfoDto } from './dto/communication.dto';
import { CreateFileMetaDto, FileDto  } from './dto/assets.dto';
import { SectionSchema } from './assetsdb.schema';
import { FileMeta, File, Section } from './interface/assets.interface';

@Injectable()
export class AssetsService {
    constructor(
        private readonly httpService: HttpService,
        @Inject(Constants.FileMetaModelToken) private readonly fileMetaModel: Model<FileMeta>,
        @Inject(Constants.FilesModelToken) private readonly filesModel: Model<File>,
    ) {}
    async getFile() {}
    async submitWork() {}
    async getFilesInfo() {
        const metas = this.fileMetaModel.find({ title: { $ne: 'file-list' } }).exec();
        const filesInfo = {};
        for(const meta of metas) {
            filesInfo[meta.title] = {
                desc: meta.desc,
                files: [],
            };
            const files = await this.filesModel.find({ meta: { $eq: meta.title }}).exec();
            files.forEach(f => {
                filesInfo[meta.title].files.push(new FileInfoDto(f));
            });
        }
        return filesInfo;
    }
    async updateWeekly(updateCommand: UpdateCommandDto) {
        const fileListMeta = await this.fileMetaModel.findOne({ title: 'file-list' }).exec();
        // here toObject() just to avoid warning from ts that type object has no attribute 'Version'.
        if (fileListMeta.toObject().filePaths.Version === updateCommand.fileListMark) {
            return Promise.reject('No need to update');
        }

        const date = new Date();
        const timestamp = date.toLocaleString();
        const fileList: Map<string, string> = await getFileList(updateCommand.fileListMark, this.httpService);
        const filesMeta = await this.fileMetaModel.find({ title: { $ne: 'file-list' } }).exec();

        for (const meta of filesMeta) {
            try {
                const updatingMeta = new CreateFileMetaDto(meta.title, meta.nameRegex, meta.desc, meta.reincarnation);
                for (const [fileName, filePath] of fileList.entries()) {
                    const reg = new RegExp(meta.nameRegex);
                    if (reg.test(fileName) && meta.filePaths[fileName] !== filePath) {
                        meta.filePaths[fileName] = filePath;
                        updatingMeta.filePaths[fileName] = filePath;
                    }
                }
                const rawTexts = await fetchFiles(updatingMeta, this.httpService);
                const sectionModel: Model<Section> = model('section', SectionSchema);
                for (const rawText of rawTexts) {
                    const sections = splitToSections(rawText, updateCommand.remarks);
                    sections.forEach(sec => sec.lastUpdated = timestamp);
                    const file = await this.filesModel.findOne({ name: rawText.name, meta: rawText.meta }).exec();
                    if (file) {
                        file.lastUpdated = timestamp;
                        for (const sec of sections) {
                            sec.lastUpdated = file.lastUpdated;
                            let contraposition =
                                rawText.reincarnation ? file.sections.find(cur => cur.hash === sec.hash) : file.sections[sec.inFileId];
                            if (contraposition && contraposition.hash === sec.hash) {
                                continue;
                            }
                            else if (!contraposition) {
                                file.sections.push(new sectionModel(sec));
                            }
                            else if (contraposition.hash === sec.hash && rawText.reincarnation) {
                                contraposition.inFileId = sec.inFileId;
                                contraposition.lastUpdated = sec.lastUpdated;
                            }
                            else if (contraposition.hash !== sec.hash && contraposition.inFileId === sec.inFileId) {
                                contraposition = new sectionModel(sec);
                            }
                            else {
                                contraposition.lastUpdated = sec.lastUpdated;
                            }
                        }
                        file.save();
                    } else {
                        const newFile = new FileDto(rawText);
                        newFile.lastUpdated = timestamp;
                        newFile.sections = sections;
                        const newModel = new this.filesModel(newFile);
                        newModel.save();
                    }
                }
                meta.markModified('filePaths');
                meta.save();
            } catch (err) {
                console.log('Failed in update meta: ', err);
            }
            // update file list version only if all files updated
            fileListMeta.set({
                filePaths: {
                    Version: updateCommand.fileListMark,
                },
            });
        }
        return Promise.resolve('Ok');
    }

    async PackTranslations() { }
}
