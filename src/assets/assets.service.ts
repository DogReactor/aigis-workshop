import { Injectable, HttpService, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { Constants, WorkModel, ContractedMethods } from '../constants';
import { FileRequest, SubmitWork } from './interface/service.interface';
import { getFileList, fetchFile, splitToSections } from './operations/update.operation';
import { CmUpdateDto } from './dto/communication.dto';
import { CreateFileDto, StoreKeys, CreateCommitDto } from './dto/assets.dto';
import { ArchiveModel, FileModel, SectionModel } from './interface/assets.interface';
import { ObjectId } from 'bson';

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

function generateHash(text: string): string {
    const md5 = crypto.createHash('md5');
    md5.update(text);
    return md5.digest('hex');
}
@Injectable()
export class AssetsService {
    private fileListVersion: string;
    constructor(
        private readonly httpService: HttpService,
        @Inject(Constants.ArchivesModelToken) private readonly ArchivesModel: Model<ArchiveModel>,
        @Inject(Constants.FilesModelToken) private readonly filesModel: FileModel,
    ) { }
    async getFile(fileRequest: FileRequest): Promise<Array<SectionModel>> {
        return;
    }

    // 我来写
    async contract(proposal: ObjectId) {
        return Promise.resolve('ok');
    }

    // 我来写
    async submitWork(submitedWork: SubmitWork) {

        return Promise.resolve('ok');
    }

    // 参考update.operations
    async updateWeekly(updateCommand: CmUpdateDto) {
        this.fileListVersion = this.fileListVersion || (await this.ArchivesModel.findOne({ dlName: 'file-list' }).exec()).path;
        if (this.fileListVersion === updateCommand.fileListMark) {
            return Promise.reject('need not updating');
        }

        try {
            const fileList: Map<string, string> = await getFileList(updateCommand.fileListMark, this.httpService);
            for (const [fileName, filePath] of fileList.entries()) {
                if (!requestFiles.find((v) => fileName.includes(v))) {
                    continue;
                }
                const archive = (await this.ArchivesModel.findOne({ dlNname: fileName }).exec()) ||
                    (await this.ArchivesModel.create({ dlName: fileName, files: [], path: '' }));
                if (archive.path === filePath) {
                    continue;
                }
                await (async () => {
                    try {
                        const rawTexts = await fetchFile(fileName, filePath, this.httpService);
                        for (const rawText of rawTexts) {
                            const textHash = generateHash(rawText.text);
                            const infoIndex = archive.files.findIndex(f => f.name === rawText.name);
                            if (infoIndex !== -1 && archive.files[infoIndex].hash === textHash) {
                                continue;
                            }
                            const sections = splitToSections(rawText, updateCommand.remarks);
                            const docModel = await this.filesModel.findOne(m => m.name === rawText.name).exec() ||
                                await this.filesModel.create(new CreateFileDto(rawText.name));
                            const newSections = sections.filter(s => !docModel.sections.find(se => se === s.hash));
                            docModel.mergeSections(newSections);
                            archive.updateFileInfo(rawText.name, textHash, docModel._id, infoIndex);
                        }
                    }
                    catch (err) {
                        fs.appendFile('update.err',
                            `Failed in updating ${fileName}, path ${filePath}\r\n`,
                            { flag: 'a+' });
                    }
                });
            }
            const fileListInfo = await this.ArchivesModel.findOne({ dlName: 'file-list' }).exec();
            this.fileListVersion = updateCommand.fileListMark;
            fileListInfo.path = updateCommand.fileListMark;
            fileListInfo.save();
        } catch (err) {
            console.log('Failed in updating\n', err);
            return Promise.reject('Failed in updating');
        }
        return 'ok';
    }

    // 我来实现
    async PackTranslations() { }
}
