import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { FileRequest, RequestFileInfo, SubmitWork, ContractProposal, Section } from './interface/service.interface';
import { CmUpdateDto } from './dto/communication.dto';
import { AssetsService } from './assets.service';
@Controller('assets')
export class AssetsController {
    constructor(
        private readonly assetsService: AssetsService) { }
    @Post('update') // 更新数据库文件
    async updateFiles(@Body() updateCommand: CmUpdateDto): Promise<string> {
        return this.assetsService.updateWeekly(updateCommand);
    }
    @Get('request_files_info') // 请求文件列表
    async getFilesInfo(): Promise<RequestFileInfo[]> {
        return this.assetsService.getFilesInfo();
    }

    @Post('request_file') // 请求单个文件内容
    async getFile(@Body() fileRequest: FileRequest): Promise<Array<Section>> {
        return this.assetsService.getFile(fileRequest);
    }

    @Post('submit_work') // 提交工作
    async submitWork(@Body() submitedWork: SubmitWork): Promise<string> {
        return this.assetsService.submitWork(submitedWork);
    }

    @Post('contract') // 圈文运动
    async contract(@Body() proposal: ContractProposal): Promise<string> {
        return this.assetsService.contract(proposal);
    }
}
