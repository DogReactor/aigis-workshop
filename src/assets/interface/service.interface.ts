import { UserAuthorities } from '../../users/users.model';
import { WorkModel, SectionStatus, ContractedMethods } from '../../constants';

export interface UpdateCommand {
    fileListMark: string;
    remarks: object;
}

export interface FileRequest {
    name: string;
    meta: string;
    user: UserAuthorities;
    model: WorkModel;
}

export interface SubmitWork {
    works: Array<{ hash: string, text: string }>;
    type: SectionStatus;
    name: string;
    meta: string;
    time: string;
    author: UserAuthorities;
}