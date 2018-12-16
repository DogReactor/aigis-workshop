import { SectionStatus, FileType } from '../../constants';
import { ObjectId } from 'bson';
import * as mongoose from 'mongoose';
export const StoreKeys = ['raw', 'translated', 'corrected', 'embellished'];
export class CreateFileDto {
    constructor(public name: string, public assetsPath: string, public type: FileType) { }
}

export class CreateCommitDto {
    time: number;
    constructor(
        public type: SectionStatus,
        public text: string,
        public author?: string,
        public originCommit?: string,
    ) {
        this.time = (new Date()).getTime();
    }
}

export class CreateSectionDto {
    hash?: string;
    constructor(
        public originText: string,
        public desc: string = '',
    ) { }
}

export class CreateArchiveDto {
    constructor(public dlName, public files: Array<string> = [], public path: string = '') { }
}

export class CreateCollectionDto {
    constructor(public token: string,
                public name: string,
                public type: string,
                public sectionPointers: any[],
                ) { }
}
