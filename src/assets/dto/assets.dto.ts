import * as crypto from 'crypto';
import * as path from 'path';
import { SectionStatus } from '../../constants';
import { SubmitWork } from '../interface/service.interface';
import { ObjectId } from 'bson';



export class CreateFileInfoDto {
    sectionsNumber: number;
    translatedNumber: number;
    correctedNumber: number;
    embellishedNumber: number;
    contractedNumber: number;
    published: boolean;
    constructor(
        public name: string,
    ) { }
}

export class CreateFileMetaDto {
    filesInfo: Array<CreateFileInfoDto> = [];
    filePaths: object = {};
    constructor(
        public title: string,
        public nameRegex: string,
        public desc: string,
        public reincarnation: boolean,
    ) { }
}

export const StoreKeys = ['raw', 'translated', 'corrected', 'embellished'];
export class CreateFileDto {
    lastUpdated: string = '';
    lastPublished: string = '';
    contractedNumber: number = 0;
    sections: Array<string> = [];
    published: boolean = false;
    constructor(public name: string) { }
}

export class CreateCommitDto {
    author: string;
    time: string;
    type: SectionStatus;
    origin: ObjectId;
}

export class CreateSectionDto {
    hash: string;
    desc: string;
    origin: string;
}
