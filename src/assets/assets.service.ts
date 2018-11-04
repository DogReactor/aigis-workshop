import { Injectable, HttpService, Inject } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import { Constants, FileType, SectionStatus } from '../constants';
import { SubmitWork, UpdateCommand } from './interface/service.interface';
import { getFileList, fetchFile, splitToSections } from './operations/update.operation';
import { CreateFileDto, CreateCommitDto, CreateArchiveDto } from './dto/assets.dto';
import { ArchiveModel, FileModel, SectionModel } from './interface/assets.interface';

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

    async getFile(id: string) {
        const file = await this.filesModel.findOne({ _id: id }).exec();
        return file;
    }
    async getFiles(reg?: string, skip?: number, limit?: number, sort?: string) {
        const query: any = {};
        if (reg) query.name = {
            $regex: reg,
        };
        let filesPointer = this.filesModel.aggregate(
            [
                { $match: query },
                {
                    $project: {
                        name: 1,
                        assetsPath: 1,
                        type: 1,
                        lastUpdated: 1,
                        translated: 1,
                        corrected: 1,
                        polished: 1,
                        contractors: 1,
                        sectionCount: {
                            $size: '$sections',
                        },
                    },
                },
            ],
        );
        if (sort === 'update') filesPointer.sort({ lastUpdated: -1 });
        if (skip) filesPointer = filesPointer.skip(skip);
        if (limit) filesPointer = filesPointer.limit(limit);
        const result = await filesPointer.exec();
        return result;
    }

    async contract(fileid: string, proposal: string, count: number) {
        let file = await this.filesModel.findById(fileid).exec();
        if (!file) throw Constants.FILE_NOT_FOUND;
        else {
            file = await file.contractSections(proposal, count);
            const sectionCount = file.sections.length;
            file.sections = undefined;
            const fileObj = file.toObject();
            fileObj.sectionCount = sectionCount;
            return fileObj;
        }
    }

    async getContractedSection(fileid: string, user: string) {
        const file = await this.filesModel.findById(fileid).exec();
        if (!file) throw Constants.FILE_NOT_FOUND;
        else {
            return await file.getContractedSections(user);
        }
    }
    async getSectionsByUser(userId, skip?: number, limit?: number) {
        const query = this.sectionsModel.find({ 'contractInfo.contractor': userId });
        if (skip) query.skip(skip);
        if (limit) query.limit(limit);
        return await query.exec();
    }
    async getSectionsCountByUser(userId) {
        const query = this.sectionsModel.aggregate([
            { $match: { 'contractInfo.contractor': userId } },
            {
                $group: {
                    _id: '$translated',
                    count: { $sum: 1 },
                },
            },
        ]);
        return await query.exec();
    }
    async getSections(fileid: string, skip?: number, limit?: number) {
        const file = await this.filesModel.findById(fileid).exec();
        if (!file) throw Constants.FILE_NOT_FOUND;
        else {
            return await file.getSections(skip, limit);
        }
    }

    async submitWork(submitedWork: SubmitWork) {
        for (const work of submitedWork.works) {
            const section = await this.sectionsModel.findById(work.sectionId).exec();
            if (section) {
                const commit = await section.addCommit(new CreateCommitDto(work.type, work.text, submitedWork.userId, work.originId));
                if (work.polished) {
                    await section.addCommit(new CreateCommitDto(
                        SectionStatus.Polished,
                        work.text,
                        submitedWork.userId,
                        commit._id,
                    ));
                }
            }
        }
        return true;
    }

    // 参考update.operations
    async updateWeekly(updateCommand: UpdateCommand) {
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
                        const infoIndex = archive.files.length > 0 ? archive.files.findIndex(f => f.name === rawText.name) : -1;
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
                        const docModel = await this.filesModel.createFile(new CreateFileDto(rawText.name, filePath, rawText.fileType));
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
            console.log(end - init);
        } catch (err) {
            console.log('Failed in updating\n', err);
            return Promise.reject('Failed in updating');
        }
        return 'ok';
    }

    // 我来实现
    async PackTranslations() { }
}
