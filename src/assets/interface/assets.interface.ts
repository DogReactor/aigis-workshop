import { Document, Model, Types } from 'mongoose';
import { CreateSectionDto, CreateFileDto, CreateCommitDto, CreateFileInfoDto } from '../dto/assets.dto';
import { ObjectID, ObjectId } from 'bson';
import { SectionStatus } from '../../constants';

export interface ArchiveModel extends Document {
  readonly dlName: string;
  files: [{
    name: string;
    hash: string;
    ref: ObjectId;
  }];
  path: string;
  updateFileInfo(uname: string, uhash: string, uref: ObjectId, infoIndex: number);
}

// Commit是Section的SubDocument
export interface Commit extends Types.Subdocument {
  readonly author: ObjectId;
  readonly time: number;
  readonly text: string;
  readonly type: SectionStatus;
  readonly origin: ObjectId;
}

// Section以引用的方式存放于File的Sections[]中
export interface Section extends Document {
  readonly hash: string;
  readonly commits: Types.DocumentArray<Commit>;
  readonly rawCommit: ObjectId;
  lastCommit: ObjectId;
  translated: boolean;
  corrected: boolean;
  polished: boolean;
  lastPublish: number;
  lastUpdated: number;
  publish: ObjectId | null;
  desc?: string;
  contractInfo: {
    contractor: ObjectId;
    time: number;
  } | null;
  getCommit(id: ObjectId): Commit;
  publishCommit(id: ObjectId): Promise<boolean>;
  addCommit(commit: CreateCommitDto): Promise<boolean>;
  contract(proposal: ObjectId): Promise<boolean>; // 应当立刻承包，传入user的objectID
}
export interface SectionModel extends Model<Section> {
  hasSection(string): Promise<Section | null>;
}

// addCommit: 可以由客户端直接发送sectionId和createCommitDto来添加Commit，不需要通过File了。

// File应当是大部分时候的入口
export interface File extends Document {
  name: string;
  assetsPath: string;         // 更新的时候用来判断文件是否发生变化
  lastUpdated: number;
  lastPublished: number;
  sections: string[];
  getSections(): Promise<Section[]>;
  getPublishedText?(): string[];
  appendSections?(section: Array<CreateSectionDto>): Promise<number>;
  contractSections(start?: number, end?: number);
  getFileInfo(): {};  // virtual?
}
export interface FileModel extends Model<File> {
  createFile(file: CreateFileDto): File;
}

// getPublishedText: 取出sections中publish不为null的，然后map结果，通过getCommit()来取出publish的Commit，以及originCommit的Commit，origin \t publish 返回。 如果性能堪忧，这里考虑做一下缓存。

// addSections: UpdateWeekly的时候，先hasSection检查是否存在，如果不存在则addSections([newsection])。若这个fileDocument本身就是新的，则直接addSections([allSections])