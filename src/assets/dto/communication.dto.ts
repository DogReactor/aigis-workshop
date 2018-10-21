import { WorkModel } from '../../constants';
import { UpdateCommand, FileInfo, FileRequest } from '../interface/service.interface';
import { UserAuthorities } from '../../users/users.model';

export class CmUpdateDto implements UpdateCommand{
    readonly fileListMark: string;
    readonly remarks: object;
}

export class CmFileInfoDto implements FileInfo {
    name: string;
    published: boolean;
    translatedNumber: number;
    correctedNumber: number;
    publishedNumber: number;
    orderedNumber: number;
    contractedNumer: number;
    contractor: string;
}

export class CmFileRequestDto implements FileRequest{
    file: string;
    meta: string;
    user: UserAuthorities;
    model: WorkModel = WorkModel.Reading;
}