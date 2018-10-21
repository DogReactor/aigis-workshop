import { Document, Model } from 'mongoose';
import { FileInfo, Commit, Section, ContractProposal } from './service.interface';
import { CreateSectionDto, CreateFileDto, CreateCommitDto, CreateFileInfoDto } from '../dto/assets.dto';

export interface DBFileInfo extends FileInfo{
  filePath: string;
}

export interface DBFileMeta extends Document {
  readonly title: string;
  readonly nameRegex: string;
  readonly desc: string;
  readonly reincarnation: boolean;
  filePaths: object;
  filesInfo: Array<DBFileInfo>;
  updateInfo(newInfo: CreateFileInfoDto);
}

export interface DBCommit extends Document, Commit { }

export interface DBSection extends Document, Section {
  commits: Array<DBCommit>;
  contract(proposal: ContractProposal): boolean;
}

export interface DBFile extends Document {
  name: string;
  meta: string;
  lastUpdated: string;
  lastPublished: string;
  contractedNumber: number;
  raw: Array<DBSection>;
  translated: Array<DBSection>;
  corrected: Array<DBSection>;
  embellished: Array<DBSection>;
  published: boolean;
  search(section: CreateSectionDto, attr: string);
  getSection(token: object): DBSection;
  getFileInfo();
  addSections(section: Array<CreateSectionDto>);
  resetSection(token: object, section: CreateSectionDto);
}

export interface DBFileModel extends Model<DBFile> {
  createFile(file: CreateFileDto, time?: string);
}