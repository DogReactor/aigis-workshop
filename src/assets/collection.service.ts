import { Injectable, HttpService, Inject } from '@nestjs/common';
import { Constants, FileType, SectionStatus } from '../constants';
import { ArchiveModel, FileModel, CollectionModel } from './interface/assets.interface';
import { DownloaderService } from './downloader.service';
import { CreateCollectionDto } from './dto/assets.dto';
import * as fs from 'fs-extra';
import * as path from 'path';

class MissionTalk {
    private refer: Map<number, number> = new Map();
    constructor(talks: any[]) {
        let offset = -1;
        talks.forEach((t, index) => {
            offset += t.RecordOffset + 1;
            this.refer.set(offset, index);
        });
    }
    getIndex(offset: number) {
        return this.refer.get(offset);
    }
}

class SectionPointer {
    constructor(public file: string, public index: number[]) { }
}

@Injectable()
export class CollectionService {
    constructor(
        private readonly downloaderService: DownloaderService,
        @Inject(Constants.FilesModelToken) private readonly filesModel: FileModel,
        @Inject(Constants.CollectionsModelToken) private readonly collectionsModel: CollectionModel,
    ) { }
    async updateIndex(remarks: any) {
        const updating = [];
        if (remarks.hasOwnProperty('Quests')) {
            updating.push(this.updateQuestCol(remarks.Quests));
        }
        if (remarks.hasOwnProperty('Units')) {
            updating.push(this.updateUnitCol(remarks.Units));
        }
        try {
            await Promise.all(updating);
            return 'ok';
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }
    async updateUnitCol(unitInfo) {
        const names = (await this.downloaderService.fetchFile('NameText.atb')).Contents.map(n => n.Message);
        const skillList = (await this.downloaderService.fetchFile('SkillList.atb')).Contents;

        for (const unit of unitInfo) {
            try {
                let sectionPointers = [];
                sectionPointers.push(new SectionPointer('NameText.atb', [unit.CardID - 1]));
                sectionPointers.push(new SectionPointer('AbilityList.atb', unit.Abilities));
                sectionPointers.push(new SectionPointer('AbilityText.atb', unit.Abilities));
                sectionPointers.push(new SectionPointer('SkillList.atb', unit.Skills));
                sectionPointers.push(new SectionPointer('SkillText.atb', unit.Skills.map(s => skillList[s].ID_Text)));
                sectionPointers = sectionPointers.filter(e => e.index.length > 0);

                let flavorLen = 8;
                if (unit.Flavor === 42 || parseInt(unit.Rare, 10) < 2 || parseInt(unit.InitClassID, 10) < 100) {
                    flavorLen = 1;
                }
                // 索引比flavor序号少1???
                sectionPointers.push(new SectionPointer('StatusText.atb', [...(new Array(flavorLen)).fill(unit.Flavor - 1).map((n, i) => i + n)]));

                const filesNameGetter = (archive: string) => {
                    let numberStr = unit.CardID.toString().padStart(4, '0');
                    if (archive === 'HarlemText') {
                        return (new Array(2)).fill(path.join(archive, `HarlemText_${numberStr}_`)).map((f, i) => f + i.toString() + '.txt');
                    } else if (archive.includes('HarlemEventText')) {
                        return (new Array(2)).fill(path.join(archive, `EventText_${numberStr}_`)).map((f, i) => f + i.toString() + '.txt');
                    } else {
                        numberStr = numberStr.padStart(6, '0');
                        return [path.join(archive, `ev${numberStr}`, '_evtxt.atb')];
                    }
                };
                const harlemArchiveNames = ['HarlemText', 'HarlemEventText0', 'HarlemEventText1', 'prev03', 'paev03', 'pcev03'];
                for (const esp of harlemArchiveNames) {
                    const candidates = filesNameGetter(esp);
                    for (const alf of candidates) {
                        const file = await this.filesModel.findOne({ name: alf }).exec();
                        if (file) {
                            sectionPointers.push(new SectionPointer(alf, [-1]));
                        }
                    }
                }

                this.collectionsModel.createCollection(
                    new CreateCollectionDto(`Unit_${unit.CardID}`, names[unit.CardID - 1], 'Unit', sectionPointers),
                );
            } catch (err) {
                console.log('Err in update: ', names[unit.CardID - 1], '\n', err);
                fs.appendFile('update.collection.err',
                    `Failed in updating Unit ${names[unit.CardID - 1]} (CardID: ${unit.CardID}), ${(new Date()).toDateString()}\n`,
                    { flag: 'a+' });
            }
        }
    }
    async updateQuestCol(questInfo) {
        const q2mDict = new Map();
        const missionNames = new Map();
        try {
            await (Promise.all([
                this.downloaderService.fetchFilesSet((s) => s.includes('MissionQuestList.atb')),
                this.downloaderService.fetchFilesSet((s) => s.includes('MissionConfig.atb')),
            ]).then(([ms, mls]) => {
                ms.forEach(m => m.Contents.forEach(e => q2mDict.set(e.QuestID, e.MissionID)));
                mls.forEach(missionList => missionList.Contents.forEach(e => missionNames.set(e.MissionID, e.Name)));
                return 'finished loading mission infos';
            }));
        } catch (err) {
            console.log(`Err in get missions info\n${err}`);
            return Promise.reject(err);
        }


        for (const quest of questInfo) {
            try {
                const sectionPointers = [];
                const missionId = q2mDict.get(quest.QuestID);
                if (!missionId) {
                    continue;
                }
                const QuestBaseName = (await this.downloaderService.fetchFile(`QuestNameText${missionId}.atb`)).Contents[quest.QuestTitle].Message;
                const QuestName = missionNames.get(missionId) + '/' + QuestBaseName;
                sectionPointers.push(new SectionPointer(`QuestNameText${missionId}.atb`, [quest.QuestTitle]));
                sectionPointers.push(new SectionPointer(`MessageText${missionId}.atb`, [quest.QuestTitle]));
                const entryNo = quest.EntryNo.toString().padStart(2, '0');
                const mapEntry = (await this.downloaderService.fetchFile(`Map${quest.MapNo}.aar`)).
                    Files.find(e => e.Name === `Entry${entryNo}.atb`).Content.Contents;
                const talkFile = await this.downloaderService.fetchFile(`BattleTalkEvent${missionId}.aar`);
                if (talkFile.Files) {
                    const missionTalk = new MissionTalk(
                        talkFile.Files
                            .find(e => e.Name === 'BattleTalkEvent.atb').Content.Contents,
                    );
                    const BattleTalk = [
                        new SectionPointer(`QuestEventText.atb`, []),
                        new SectionPointer(`BattleTalkEvent${missionId}\\BattleTalkEvent.atb`, []),
                    ];
                    mapEntry.forEach(e => {
                        if (e.EnemyID > 999 && e.EnemyID < 2000) {
                            BattleTalk[0].index.push(e.EnemyID - 1000);
                        }
                        else if (e.EnemyID === 4201 && e.EntryCommand.includes('CallEvent')) {
                            const locs = e.EntryCommand.replace('CallEvent(', '').replace(');', '').split(',').map(s => parseInt(s, 10));
                            locs.forEach(offset => BattleTalk[1].index.push(missionTalk.getIndex(offset)));
                        }
                    });
                    BattleTalk.filter(sp => sp.index.length > 0).forEach(b => sectionPointers.push(b));
                }
                this.collectionsModel.createCollection(
                    new CreateCollectionDto(`Quest_${quest.QuestID}`, QuestName, 'Quest', sectionPointers),
                );
            } catch (err) {
                console.log('Err in update: ', quest.QuestID, '\n', err);
                fs.appendFile('update.collection.err',
                    `Failed in updating Quest ${quest.QuestID}, ${(new Date()).toDateString()}\n`,
                    { flag: 'a+' });
            }
        }
        return 'ok';
    }
}