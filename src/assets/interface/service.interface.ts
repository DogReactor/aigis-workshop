import { User } from '../../users/users.interface';
import { WorkModel, SectionStatus, ContractedMethods, UserAuthority } from '../../constants';

export interface UpdateCommand {
    fileListMark: string;
    remarks: object;
}

export interface FileRequest {
    id: string;
}

export interface SubmitWork {
    works: Array<{ sectionId: string, text: string, originId: string, type: SectionStatus, polished: boolean }>;
    userId?: string;
}