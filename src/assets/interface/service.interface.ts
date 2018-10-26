import { User } from '../../users/users.interface';
import { WorkModel, SectionStatus, ContractedMethods, UserAuthority } from '../../constants';

export interface UpdateCommand {
    fileListMark: string;
    remarks: object;
}

export interface FileRequest {
    name: string;
    meta: string;
    model: WorkModel;
}

export interface SubmitWork {
    works: Array<{ hash: string, text: string }>;
    permission: UserAuthority;
    name: string;
    meta: string;
    time: string;
    user: User;
}