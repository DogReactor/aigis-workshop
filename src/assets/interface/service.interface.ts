import { User } from '../../users/users.interface';
import { WorkModel, SectionStatus, ContractedMethods, UserAuthority } from '../../constants';

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

export interface RequestFileInfo {
    readonly meta: string;
    readonly filesInfo: Array<FileInfo>;
}

export interface FileRequest {
    name: string;
    meta: string;
    model: WorkModel;
}

export interface Commit{
    readonly author: string;
    readonly commitId: string;
    readonly time: string;
    readonly text: string;
    readonly type: SectionStatus;
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
    contractInfo: {
        contractor: string;
        time: string;
    };
}

export interface SubmitWork {
    works: Array<{ hash: string, text: string }>;
    permission: UserAuthority;
    name: string;
    meta: string;
    time: string;
    user: User;
}

export interface ContractProposal {
    method: ContractedMethods;
    number?: number;
    hashes?: Array<string>;
    name: string;
    meta: string;
    permission: UserAuthority;
    user: User;
    time: string;
}