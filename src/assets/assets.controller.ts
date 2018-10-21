import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { FileRequest, RequestFileInfo, SubmitWork, ContractProposal } from './interface/service.interface'
import { CmUpdateDto } from './dto/communication.dto';
import { AssetsService } from './assets.service';
@Controller('assets')
export class AssetsController {
    constructor(
        private readonly assetsService: AssetsService) { }
    @Post('update')
    async updateFiles(@Body() updateCommand: CmUpdateDto) {
        return this.assetsService.updateWeekly(updateCommand);
    }

    @Get('request_files_info')
    async getFilesInfo(): Promise<RequestFileInfo[]> {
        return this.assetsService.getFilesInfo();
    }

    @Post('request_file')
    async getFile(@Body() fileRequest: FileRequest) {
        return this.assetsService.getFile(fileRequest);
    }

    @Post('submit_work')
    async submitWork(@Body() submitedWork: SubmitWork) {
        return this.assetsService.submitWork(submitedWork);
    }

    @Post('contract')
    async contract(@Body() proposal: ContractProposal) {
        return this.assetsService.contract(proposal);
    }
}
