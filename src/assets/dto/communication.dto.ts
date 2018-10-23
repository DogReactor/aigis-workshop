import { WorkModel } from '../../constants';
import {CreateSectionDto} from './assets.dto';
import { UpdateCommand, FileInfo,  FileRequest } from '../interface/service.interface';
import { UserAuthorities } from '../../users/users.model';

export class CmUpdateDto implements UpdateCommand{
    readonly fileListMark: string;
    readonly remarks: object;
}

