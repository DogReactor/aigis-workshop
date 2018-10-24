import { Injectable, HttpService, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import * as fs from 'fs-extra';
import { Constants, WorkModel, ContractedMethods } from '../constants';
import { FileRequest, SubmitWork, ContractProposal, Section } from './interface/service.interface';
import { getFileList, fetchFile, splitToSections, attachRemarks, updateDoc } from './operations/update.operation';
import { CmUpdateDto } from './dto/communication.dto';
import { CreateFileMetaDto, CreateFileDto, StoreKeys, CreateCommitDto } from './dto/assets.dto';
import { DBFileMeta, DBFileModel, DBSection } from './interface/assets.interface';
import { resolve } from 'dns';
import { readFile } from 'fs';

@Injectable()
export class AssetsService {
    constructor(
        private readonly httpService: HttpService,
        @Inject(Constants.FileMetaModelToken) private readonly fileMetaModel: Model<DBFileMeta>,
        @Inject(Constants.FilesModelToken) private readonly filesModel: DBFileModel,
    ) { }
    async getFile(fileRequest: FileRequest): Promise<Array<Section>> {
        const file = await this.filesModel.findOne({ meta: fileRequest.meta, name: fileRequest.name }).exec();
        let sections: Array<DBSection> = [];
        // To Do 鉴权
        if (fileRequest.model === WorkModel.Reading) {
            sections = file.raw.concat(file.translated, file.corrected, file.embellished);
        } else {
            sections = file[StoreKeys[fileRequest.model - 1]];
        }
        return Promise.resolve(sections);
    }
    async contract(proposal: ContractProposal) {
        const file = await this.filesModel.findOne({ meta: proposal.meta, name: proposal.name }).exec();
        // To Do 鉴权
        const store = file[StoreKeys[proposal.model - 1]];
        switch (proposal.method) {
            case ContractedMethods.all:
                store.forEach(s => s.contract(proposal));
                break;
            case ContractedMethods.random:
                const number = proposal.number && proposal.number <= 0 ? Math.floor(Math.random() * store.length) : proposal.number;
                let count = 0;
                for (const section of store) {
                    if (count < number) {
                        count = section.contract(proposal) ? count + 1 : count;
                    } else {
                        break;
                    }
                }
                break;
            case ContractedMethods.select:
                if (proposal.hashes) {
                    for (const hash of proposal.hashes) {
                        store.find(s => s.hash === hash).contract(proposal);
                    }
                }
                break;
        }
        file.save();
        return Promise.resolve('ok');
    }
    async submitWork(submitedWork: SubmitWork) {
        const file = await this.filesModel.findOne({ meta: submitedWork.meta, name: submitedWork.name }).exec();
        // To Do 鉴权
        const store = file[StoreKeys[submitedWork.type - 1]];
        for (const work of submitedWork.works) {
            const section = store.find(s => s.hash === work.hash);
            section.text = work.text;
            section.contractor = '';
            section.commits.push(new CreateCommitDto(submitedWork, work.text));
        }
        file.save();
        return Promise.resolve('ok');
    }
    async getFilesInfo() {
        const metas = await this.fileMetaModel.find({ title: { $ne: 'file-list' } }).exec();
        return metas.map(meta => {
            return {
                meta: meta.title,
                filesInfo: meta.filesInfo,
            };
        });
    }
    async updateWeekly(updateCommand: CmUpdateDto) {
        const fileListMeta = await this.fileMetaModel.findOne({ title: 'file-list' }).exec();
        // here toObject() just to avoid warning from ts that type object has no attribute 'Version'.
        if (fileListMeta.toObject().filePaths.Version === updateCommand.fileListMark) {
            return 'need not update';
        }
        const date = new Date();
        const timestamp = date.toLocaleString();

        const fileList: Map<string, string> = await getFileList(updateCommand.fileListMark, this.httpService);
        const filesMeta = await this.fileMetaModel.find({ title: { $ne: 'file-list' } }).exec();
        for (const meta of filesMeta) {
            // 删除这个await可以让所有meta并行处理
            await (async () => {
                const updatingMeta = new CreateFileMetaDto(meta.title, meta.nameRegex, meta.desc, meta.reincarnation);
                for (const [fileName, filePath] of fileList.entries()) {
                    const reg = new RegExp(meta.nameRegex);
                    if (reg.test(fileName) && meta.filePaths[fileName] !== filePath) {
                        updatingMeta.filePaths[fileName] = filePath;
                    }
                }
                for (const file of Object.keys(updatingMeta.filePaths)) {
                    // 删除这个await可以让这个meta需要update的数个文件并行请求
                    await (async () => {
                        try {
                            let rawSections = (await fetchFile(file, updatingMeta.filePaths[file], this.httpService)).map(t => splitToSections(t));
                            rawSections = rawSections.map(t => attachRemarks(meta.title, t, updateCommand.remarks));
                            const files = rawSections.map(t => new CreateFileDto(t, meta));

                            for (const f of files) {
                                // 删除这个await可以让所有条目一起入库
                                // 但建议一条一条来，不然我那个破服务器怕是会炸。多的文本几千条，同时入库我怕撑不住
                                await (async () => {
                                    let docInfo;
                                    try {
                                        docInfo = await updateDoc(f, meta, this.filesModel, timestamp);
                                    } catch (err) {
                                        fs.appendFile('update.err',
                                            `Failed in updating oc from ${file}, path ${updatingMeta.filePaths[file]}, [${timestamp}]\r\n`,
                                            { flag: 'a+' });
                                    }
                                    meta.updateInfo(docInfo);
                                    meta.filePaths[file] = updatingMeta.filePaths[file];
                                })();
                            }
                            console.log(`${file} updated!`);
                        } catch (err) {
                            console.log(err);
                        }
                    })();
                }
                console.log(`meta ${meta} done`);
                meta.markModified('filePaths');
                meta.save();
            })();
        }

        // update file list version only if all files updated
        fileListMeta.set({
            filePaths: {
                Version: updateCommand.fileListMark,
            },
        });
        fileListMeta.save();

        return 'OK';
    }

    async PackTranslations() { }
}
