import { UserAuthorities } from '../../users/users.model';
import { WorkModel, SectionStatus } from '../../constants';

export interface UpdateCommand {
    readonly fileListMark: string;
    readonly remarks: object;
}

export interface FileInfo {
    readonly name: string;
    readonly sectionsNumber: number;
    readonly translatedNumber: number;
    readonly correctedNumber: number;
    readonly embellishedNumber: number;
    readonly contractedNumber: number;
    readonly published: boolean;
}

export interface FileRequest {
    file: string;
    meta: string;
    user: UserAuthorities;
    model: WorkModel;
}

export interface Commit{
    readonly author: string;
    readonly commitId: string;
    readonly time: string;
    readonly text: string;
    readonly kind: SectionStatus;
}

export interface Section{
    inFileId: number;
    hash: string;
    superFile: string;
    origin: string;
    text: string;
    commits: Array<Commit>;
    lastUpdated: string;
    desc: string;
    contractor: string;
}

export interface SubmitWork {
    text: string;
    time: string;
    author: UserAuthorities;
}

