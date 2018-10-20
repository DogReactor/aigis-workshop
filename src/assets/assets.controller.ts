import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { UpdateCommandDto, FileRequestCommandDto } from './dto/communication.dto';
import { AssetsService } from './assets.service';
@Controller('assets')
export class AssetsController {
    constructor(
        private readonly assetsService: AssetsService) { }
    @Post('update')
    async updateFiles(@Body() updateCommand: UpdateCommandDto) {
        return this.assetsService.updateWeekly(updateCommand);
    }

    @Get('request_files_info')
    async getFilesInfo() {
        return this.assetsService.getFilesInfo();
    }

    @Post('request_file')
    async getFile(@Body() fileRequest: FileRequestCommandDto) {
        return this.assetsService.getFile();
    }

    @Post('submit_work')
    async submitWork(@Body() fileRequest: FileRequestCommandDto) {
        return this.assetsService.submitWork();
    }
}
