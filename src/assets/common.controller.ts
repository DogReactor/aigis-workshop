import { Controller, Get, Post, Body, Res, Query } from '@nestjs/common';
import { FileRequest, RequestFileInfo, Section } from './interface/service.interface';
import { CmUpdateDto } from './dto/communication.dto';
import { AssetsService } from './assets.service';
@Controller('common')
export class CommonController {
    constructor(
        private readonly assetsService: AssetsService) { }
    @Post('update') // 更新数据库文件
    async updateFiles(@Body() updateCommand: CmUpdateDto): Promise<string> {
        return await this.assetsService.updateWeekly(updateCommand);
    }
    @Get('files') // 请求文件列表
    async getFilesInfo(): Promise<RequestFileInfo[]> {
        return await this.assetsService.getFilesInfo();
    }

    @Get('file') // 请求单个文件内容
    async getFile(@Query() fileRequest: FileRequest): Promise<Array<Section>> {
        return await this.assetsService.getFile(fileRequest);
    }
}
