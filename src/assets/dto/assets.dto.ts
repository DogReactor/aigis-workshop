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
    sections: Array<ObjectId> = [];
    published: boolean = false;
    constructor(public name: string) {}
}

export class CreateCommitDto {
    author: string;
    id: string;
    time: string;
    type: SectionStatus = SectionStatus.Raw;
    constructor(work: SubmitWork, public text: string) {
        this.author = work.author.username;
        this.time = work.time;
        this.type = work.type;
        const md5 = crypto.createHash('md5');
        md5.update(this.author);
        md5.update(text);
        md5.update(this.time);
        this.id = md5.digest('hex');
    }
}

export class CreateSectionDto{
    hash: string;
    text: string = '';
    commits: Array<CreateCommitDto> = [];
    lastUpdated: string;
    desc: string;
    contractInfo: {
        contractor: string;
        time: string;
    } = {
        contractor: '',
        time: '',
    };
    constructor(
        public origin: string,
        desc?: string,
    ) {
        this.desc = desc || '';
        const md5 = crypto.createHash('md5');
        md5.update(origin);
        md5.update(this.desc);
        this.hash = md5.digest('hex');
    }
}
