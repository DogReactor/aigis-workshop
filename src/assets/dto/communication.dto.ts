import { UpdateCommand } from '../interface/service.interface';

export class CmUpdateDto implements UpdateCommand {
    readonly fileListMark: string;
    readonly remarks: object;
}
