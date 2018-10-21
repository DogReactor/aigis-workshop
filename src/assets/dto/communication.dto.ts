import { File } from '../interface/assets.interface';

export class UpdateCommandDto {
    readonly fileListMark: string;
    readonly remarks: object;
}

export class FileInfoDto {
    name: string;
    lastPublished: string;
    translatedNumber: number;
    correctedNumber: number;
    publishedNumber: number;
    orderedNumber: number;
    constructor(fileRef: File) {
        this.name = fileRef.name;
        this.lastPublished = fileRef.lastPublished;
        this.translatedNumber = fileRef.translatedNumber;
        this.correctedNumber = fileRef.correctedNumber;
        this.publishedNumber = fileRef.publishedNumber;
        this.orderedNumber = fileRef.orderedNumber;
    }
}

export class FileRequestCommandDtoCommandDto {
    file: string;
    meta: string;
    user: string;
}