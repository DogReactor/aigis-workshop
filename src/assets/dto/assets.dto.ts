import * as crypto from 'crypto';
import * as path from 'path';
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
    filePaths: object = {};
    constructor(
        public title: string,
        public nameRegex: string,
        public desc: string,
        public reincarnation: boolean,
    ) { }
}

export class CreateFileDto {
    name: string;
    meta: string;
    lastUpdated: string = '';
    lastPublished: string = '';
    contractedNumber: number = 0;
    translated: Array<CreateSectionDto> = [];
    corrected: Array<CreateSectionDto> = [];
    embellished: Array<CreateSectionDto> = [];
    published: boolean = false;
    constructor(public raw: Array<CreateSectionDto>, meta: CreateFileMetaDto) {
        this.name = path.basename(this.raw[0].superFile);
        this.meta = meta.title;
    }
}

export class CreateCommitDto {
    author: string;
    id: string;
    time: string;
    text: string;
    kind: SectionStatus = SectionStatus.Raw;
}

export class CreateSectionDto{
    hash: string;
    text: string = '';
    commits: Array<CreateCommitDto> = [];
    lastUpdated: string;
    desc: string = '';
    contractor: string = '';
    constructor(public inFileId: number,
                public origin: string,
                public superFile: string) {
        const md5 = crypto.createHash('md5');
        md5.update(this.origin);
        md5.update(this.inFileId.toString());
        this.hash = md5.digest('hex');
    }
}
