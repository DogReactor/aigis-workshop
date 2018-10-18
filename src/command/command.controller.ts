import { Controller, Body, Post } from '@nestjs/common';
import { UpdateInfo } from './command.interface';
import { AssetsService } from '../core/assets.service';
@Controller('command')
export class CommandController {
    constructor(private readonly assetsService: AssetsService) { }
    @Post('update')
    async updateFiles(@Body() updateInfo: UpdateInfo) {
        await this.assetsService.updateFiles(updateInfo.fileListUrl, JSON.parse(updateInfo.cardsInfos));
        return 'Ok';
    }
}
