import { Controller, Get, Post, Body, Res, Query } from '@nestjs/common';
import { FileRequest, RequestFileInfo, SubmitWork, ContractProposal, Section } from './interface/service.interface';
import { CmUpdateDto } from './dto/communication.dto';
import { AssetsService } from './assets.service';
@Controller('assets')
export class AssetsController {
    constructor(
        private readonly assetsService: AssetsService) { }

    @Post('work') // 提交工作
    async submitWork(@Body() submitedWork: SubmitWork): Promise<string> {
        return await this.assetsService.submitWork(submitedWork);
    }

    @Post('contract') // 圈文运动
    async contract(@Body() proposal: ContractProposal): Promise<string> {
        return await this.assetsService.contract(proposal);
    }
}
