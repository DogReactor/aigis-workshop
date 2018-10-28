import { SectionStatus, FileType } from '../../constants';
import { ObjectId } from 'bson';

export const StoreKeys = ['raw', 'translated', 'corrected', 'embellished'];
export class CreateFileDto {
    constructor(public name: string, public assetsPath: string, public type: FileType) { }
}

export class CreateCommitDto {
    author?: ObjectId;
    time: number;
    type: SectionStatus;
    text: string;
    originCommit?: ObjectId;
}

export class CreateSectionDto {
    hash?: string;
    constructor(
        public originText: string,
        public desc: string = '',
    ) { }
}

export class CreateArchiveDto {
    constructor(public dlName, public files: Array<string> = [], public path: string = ''){}
}
