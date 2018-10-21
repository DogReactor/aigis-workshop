
export class CreateFileMetaDto{
    title: string;
    nameRegex: string;
    desc: string = '';
    filePaths: object = {};
    reincarnation: boolean = false;
    constructor(title: string, nameRegex: string, desc?: string, reincarnation?: boolean) {
        this.title = title;
        this.nameRegex = nameRegex;
        this.desc = desc;
        this.reincarnation = reincarnation;
        this.filePaths = {};
    }
}

export class RawTextInfoDto{
    meta: string;
    name: string;
    text: string;
    reincarnation: boolean;
    constructor(meta: string, name: string, text: string, reincarnation: boolean) {
        this.meta = meta;
        this.name = name;
        this.text = text;
        this.reincarnation = reincarnation;
    }
}

export class FileDto{
    name: string;
    meta: string;
    lastUpdated: string = '';
    lastPublished: string = '';
    translatedNumber: number = 0;
    correctedNumber: number = 0;
    publishedNumber: number = 0;
    orderedNumber: number = 0;
    sections: Array<TextSectionDto> = [];
    constructor(rawTextInfo: RawTextInfoDto) {
        this.name = rawTextInfo.name;
        this.meta = rawTextInfo.meta;
    }
}

export enum SectionStatus { Raw, Translated, Corrected, Polished, Published }

export class CommitDto{
    author: string;
    id: string;
    time: string;
    text: string;
    kind: SectionStatus = SectionStatus.Raw;
}

export class TextSectionDto{
    inFileId: number;
    hash: string;
    superFile: string;
    status: SectionStatus = SectionStatus.Raw;
    origin: string;
    translation: string = '';
    commits: Array<CommitDto> = [];
    lastUpdated: string;
    desc: string = '';
    ordered: string = '';
}
