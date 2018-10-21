import * as mongoose from 'mongoose';
import { SectionStatus } from '../../constants';

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
    filePaths = {};
    constructor(
        public title: string,
        public nameRegex: string,
        public desc: string,
        public reincarnation: boolean,
    ) { }
}

export class RawTextInfoDto {
    constructor(
        public meta: string,
        public name: string,
        public text: string,
        public reincarnation: boolean,
    ) { }
}

export class CreateFileDto {
    name: string;
    meta: string;
    lastUpdated: string = '';
    lastPublished: string = '';
    contractedNumber: number = 0;
    raw: Array<CreateSectionDto> = [];
    translated: Array<CreateSectionDto> = [];
    corrected: Array<CreateSectionDto> = [];
    embellished: Array<CreateSectionDto> = [];
    published: boolean = false;
}

export class CreateCommitDto {
    author: string;
    id: string;
    time: string;
    text: string;
    kind: SectionStatus = SectionStatus.Raw;
}

export class CreateSectionDto{
    inFileId: number;
    hash: string;
    superFile: string;
    origin: string;
    text: string = '';
    commits: Array<CreateCommitDto> = [];
    lastUpdated: string;
    desc: string = '';
    contractor: string;
}
