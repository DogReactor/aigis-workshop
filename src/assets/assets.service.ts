import { Injectable, HttpService, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import * as fs from 'fs-extra';
import { Constants, WorkModel, ContractedMethods } from '../constants';
import { FileRequest, SubmitWork, ContractProposal, Section } from './interface/service.interface';
import { getFileList, fetchFile, splitToSections, attachRemarks, updateDoc } from './operations/update.operation';
import { CmUpdateDto } from './dto/communication.dto';
import { CreateFileMetaDto, CreateFileDto, StoreKeys, CreateCommitDto } from './dto/assets.dto';
import { DBFileMeta, DBFileModel, DBSection } from './interface/assets.interface';

const requestFiles = [
    'AbilityList.atb',
    'AbilityText.atb',
    'BattleTalkEvent',
    // 'GloryConditionConfig',
    'HarlemEventText0.aar',
    'HarlemEventText1.aar',
    'HarlemText.aar',
    'NameText.atb',
    'prev03.aar',
    'paev03.aar',
    'pcev03.aar',
    'PlayerTitle.atb',
    'PlayerUnitTable.aar',
    'MessageText',
    'QuestEventText',
    'QuestNameText',
    'RewardText',
    'SkillList.atb',
    'SkillText.atb',
    'StatusText.atb',
    'StoryMissionConfig.atb',
    'SystemText.atb',
    'UiText.atb',
];

@Injectable()
export class AssetsService {
    private fileListVersion: string;
    private filesVersion: object;
    constructor(
        private readonly httpService: HttpService,
        @Inject(Constants.FilesModelToken) private readonly filesModel: DBFileModel,
    ) {
        const verObj = JSON.parse(fs.readFileSync('file_versions.json', 'utf8'));
        this.fileListVersion = verObj.fileListVersion || '';
        this.filesVersion = verObj.filesVersion || {};
    }
    async getFile(fileRequest: FileRequest): Promise<Array<Section>> {
        return Promise.resolve();
    }

    // 我来写
    async contract(proposal: ContractProposal) {
        return Promise.resolve('ok');
    }

    // 我来写
    async submitWork(submitedWork: SubmitWork) {

        return Promise.resolve('ok');
    }


    // 参考update.operations
    async updateWeekly(updateCommand: CmUpdateDto) {

        if (this.fileListVersion === updateCommand.fileListMark) {
            return Promise.reject('need not update');
        }
        const date = new Date();
        const timestamp = date.toLocaleString();

        const fileList: Map<string, string> = await getFileList(updateCommand.fileListMark, this.httpService);
        const updatingFiles: Array<Array<any>> = [];
        for (const [fileName, filePath] of fileList.entries()) {
            const flag = fileName.split('.')[0];
            const meta = requestFiles.find((v) => fileName.includes(v));
            if (meta && this.filesVersion[fileName] !== filePath) {
                let models = await this.filesModel.find({ name: { $in: new RegExp('^' + flag) } }).exec();
                models = models || [];
                updatingFiles.push([
                    fileName,
                    filePath,
                    models.filter(m => m.originPath !== filePath),
                ]);
            }
        }
        for (const [fileName, path, models] of updatingFiles) {
            await (async () => {
                try {
                    const rawTexts = await fetchFile(fileName, path, this.httpService);
                    for (const doc of rawTexts) {
                        const sections = splitToSections(doc);
                        const docModel = models.find(m => m.name === doc.name);
                        if(!docModel) {
                            
                        }
                    }
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
                                    `Failed in updating oc from ${file}, path ${updatingFiles.filePaths[file]}, [${timestamp}]\r\n`,
                                    { flag: 'a+' });
                            }
                            meta.updateInfo(docInfo);
                            meta.filePaths[file] = updatingFiles.filePaths[file];
                        })();
                    }
                    console.log(`${file} updated!`);
                } catch (err) {
                    console.log(err);
                }
            })();
        }

        return 'OK';
    }

    // 我来实现
    async PackTranslations() { }
}
