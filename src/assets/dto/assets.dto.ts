import * as crypto from 'crypto';
import * as path from 'path';
import { SectionStatus, FileType } from '../../constants';
import { ObjectId } from 'bson';

export const StoreKeys = ['raw', 'translated', 'corrected', 'embellished'];
export interface CreateFileDto {
    name: string;
    assetsPath: string;
    type: FileType;
}

export interface CreateCommitDto {
    author?: ObjectId;
    time: number;
    type: SectionStatus;
    text: string;
    originCommit?: ObjectId;
}

export interface CreateSectionDto {
    hash?: string;
    desc?: string;
    originText: string;
}
