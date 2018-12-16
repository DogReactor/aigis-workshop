import { Document, Model, Types } from 'mongoose';
import { CreateSectionDto, CreateFileDto, CreateCommitDto, CreateArchiveDto, CreateCollectionDto } from '../dto/assets.dto';
import { ObjectID, ObjectId } from 'bson';
import { SectionStatus, FileType } from '../../constants';

export interface Archive extends Document {
  readonly dlName: string;
  files: [{
    name: string;
    hash: string;
    ref: ObjectId;
  }];
  path: string;
  updateFileInfo(uname: string, uhash: string, uref: ObjectId, infoIndex: number);
}

export interface ArchiveModel extends Model<Archive> {
  getArchive(CreateArchiveDto): Promise<Archive>;
}

// Commit是Section的SubDocument
export interface Commit extends Types.Subdocument {
  readonly author: ObjectId;
  readonly time: number;
  readonly text: string;
  readonly type: SectionStatus;
  readonly children: ObjectId[];
}

// Section以引用的方式存放于File的Sections[]中
export interface Section extends Document {
  readonly hash: string;
  readonly commits: Types.DocumentArray<Commit>;
  rawCommit: ObjectId;
  parent: ObjectId[];
  lastPolishCommit: ObjectId | null;
  publishedCommit: ObjectId | null;
  status: SectionStatus;
  modified: boolean;
  lastPublish: number | null;
  lastUpdated: number | null;
  desc: string | null;
  contractInfo: {
    contractor: ObjectId;
    time: number;
  } | null;
  getCommit(id: ObjectId): Commit;
  publishCommit(id: ObjectId): Promise<boolean>;
  addCommit(commit: CreateCommitDto): Promise<Commit>;
  contract(proposal: ObjectId): Promise<boolean>; // 应当立刻承包，传入user的objectID
  verifyContractor(id: ObjectId): boolean;
}
export interface SectionModel extends Model<Section> {
  hasSection(hash: string): Promise<Section | null>;
  createSection(sectionDto: CreateSectionDto): Promise<Section>;
  getModified(start?: number, count?: number): Promise<Section[]>;
}

// addCommit: 可以由客户端直接发送sectionId和createCommitDto来添加Commit，不需要通过File了。

// File应当是大部分时候的入口
export interface File extends Document {
  name: string;
  assetsPath: string;         // 更新的时候用来判断文件是否发生变化
  type: FileType;
  lastUpdated: number;
  translated: number;
  corrected: number;
  polished: number;
  sections: string[];
  sectionCount?: number;
  contractors: {
    user: ObjectId,
    count: number,
  }[];

  getSections(start?: number, count?: number): Promise<Section[]>;
  getPublishedText?(): Promise<string[]>;
  mergeSections(section: Array<CreateSectionDto>): Promise<number>;
  contractSections(user: string, count: number): Promise<File>;
  getContractedSections(user: string): Promise<Section[]>;
}

export interface FileModel extends Model<File> {
  createFile(file: CreateFileDto, force?: boolean): Promise<File | null>;
}

export interface CollectionDoc extends Document {
  token: string;
  name: string;
  type: string;
  sectionPointers: [{ file: string; index: number[] }];
}

export interface CollectionModel extends Model<CollectionDoc> {
  createCollection(file: CreateCollectionDto, force?: boolean): Promise<CollectionDoc | null>;
}