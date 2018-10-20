import { Document } from 'mongoose';
import { SectionStatus } from '../dto/assets.dto';

export interface FileMeta extends Document {
  readonly title: string;
  readonly nameRegex: string;
  readonly desc: string;
  readonly filePaths: object;
  readonly reincarnation: boolean;
}

export interface Commit extends Document {
  readonly author: string;
  readonly id: string;
  readonly time: string;
  readonly text: string;
  readonly kind: SectionStatus;
}

export interface Section extends Document{
  inFileId: number;
  hash: string;
  superFile: string;
  status: SectionStatus;
  origin: string;
  translation: string;
  commits: Array<Commit>;
  lastUpdated: string;
  desc: string;
  ordered: string;
}

export interface File extends Document {
  name: string;
  meta: string;
  lastUpdated: string;
  lastPublished: string;
  translatedNumber: number;
  correctedNumber: number;
  publishedNumber: number;
  orderedNumber: number;
  sections: Array<Section>;
}