import { Controller, Post, Body, HttpException } from '@nestjs/common';
import { UpdateCommand } from './interface/service.interface';
import { AssetsService } from './assets.service';

@Controller('common')
export class CommonController {
    constructor(
        private readonly assetsService: AssetsService) { }

    @Post('update') // 更新数据库文件
    async updateFiles(@Body() updateCommand: UpdateCommand): Promise<string> {
        try {
            return await this.assetsService.updateWeekly(updateCommand);
        } catch (ex) {
            throw new HttpException(ex, 400);
        }

    }
}