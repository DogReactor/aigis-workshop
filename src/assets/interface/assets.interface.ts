import { Document, Model } from 'mongoose';
import { SectionStatus } from '../../constants';
import { FileInfo, Commit, Section } from './service.interface';
import { CreateSectionDto, CreateFileInfoDto, CreateCommitDto } from '../dto/assets.dto';

export interface DBFileInfo extends FileInfo{
  filePath: string;
}

export interface DBFileMeta extends Document {
  readonly title: string;
  readonly nameRegex: string;
  readonly desc: string;
  readonly reincarnation: boolean;
  filePaths: object;
  fileInfos: Array<DBFileInfo>;
  updateInfo(newInfo: DBFileInfo);
}

export interface DBCommit extends Document, Commit { }

export interface DBSection extends Document, Section {
  commits: Array<DBCommit>;
  commit(work: CreateCommitDto);
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
