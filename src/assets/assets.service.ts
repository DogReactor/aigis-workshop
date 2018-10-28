import { Injectable, HttpService, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { Constants, WorkModel, ContractedMethods, FileType } from '../constants';
import { FileRequest, SubmitWork } from './interface/service.interface';
import { getFileList, fetchFile, splitToSections } from './operations/update.operation';
import { CmUpdateDto } from './dto/communication.dto';
import { CreateFileDto, StoreKeys, CreateCommitDto, CreateArchiveDto } from './dto/assets.dto';
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
        @Inject(Constants.ArchivesModelToken) private readonly ArchivesModel: ArchiveModel,
        @Inject(Constants.FilesModelToken) private readonly filesModel: FileModel,
        @Inject(Constants.SectionsModelToken) private readonly sectionsModel: SectionModel,
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
            return Promise.reject('files all are unchanged');
        }
        const init = (new Date()).getTime();
        try {
            const fileList: Array<[string, string]> = await getFileList(updateCommand.fileListMark, this.httpService);
            const updatePromises = fileList.map(async pair => {
                const [fileName, filePath] = pair;
                if (!requestFiles.find((v) => fileName.includes(v))) {
                    return Promise.resolve('not be demanded');
                }
                const archive = await this.ArchivesModel.getArchive(new CreateArchiveDto(fileName));
                if (archive.path === filePath) {
                    return Promise.resolve('not need updating');
                }
                try {
                    const rawTexts = await fetchFile(fileName, filePath, this.httpService);
                    for (const rawText of rawTexts) {
                        const textHash = generateHash(rawText.text);
                        const infoIndex = archive.files.length > 0 ? archive.files.findIndex(f => f.name === rawText.name) : -1 ;
                        // let docModel = null;
                        if (infoIndex !== -1 && archive.files[infoIndex].hash === textHash) {
                            continue;
                        }
                        // else if (infoIndex !== -1) {
                        //     docModel = await this.filesModel.findOne(m => m.name === rawText.name).exec();
                        // } 
                        // else {
                        //     docModel = await this.filesModel.createFile(new CreateFileDto(rawText.name, filePath, FileType.Section));
                        // }
                        const docModel = await this.filesModel.createFile(new CreateFileDto(rawText.name, filePath, FileType.Section));
                        const sections = splitToSections(rawText, updateCommand.remarks);
                        await docModel.mergeSections(sections);
                        await archive.updateFileInfo(rawText.name, textHash, docModel._id, infoIndex);
                    }
                    archive.path = filePath;
                    archive.save();
                    return Promise.resolve('ok');
                }
                catch (err) {
                    fs.appendFile('update.err',
                        `Failed in updating ${fileName}, path ${filePath},  ${(new Date()).toDateString()}\r\n`,
                        { flag: 'a+' });
                    return Promise.reject(err);
                }
            });
            await Promise.all(updatePromises);
            const fileListInfo = await this.ArchivesModel.findOne({ dlName: 'file-list' }).exec();
            this.fileListVersion = updateCommand.fileListMark;
            fileListInfo.path = updateCommand.fileListMark;
            fileListInfo.save();
            const end = (new Date()).getTime();
            console.log(end-init);
        } catch (err) {
            console.log('Failed in updating\n', err);
            return Promise.reject('Failed in updating');
        }
        return 'ok';
    }

    // 我来实现
    async PackTranslations() { }
}
