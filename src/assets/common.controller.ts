import { Controller, Post, Body, HttpException } from '@nestjs/common';
import { UpdateCommand } from './interface/service.interface';
import { AssetsService } from './assets.service';
import { CollectionService } from './collection.service';
import { DownloaderService } from './downloader.service';
import * as fs from 'fs';

@Controller('common')
export class CommonController {
    constructor(
        private readonly assetsService: AssetsService,
        private readonly collectionService: CollectionService,
        private readonly dlService: DownloaderService,
    ) { }

    @Post('update') // 更新数据库文件
    async updateFiles(@Body() updateCommand: UpdateCommand): Promise<string> {
        try {
            return await this.assetsService.updateWeekly(updateCommand);
        } catch (ex) {
            throw new HttpException(ex, 400);
        }

    }

    @Post('update_quest')
    async updateQuest(@Body() coomand: string): Promise<string> {
        try {
            const updateCommand = JSON.parse(fs.readFileSync('D:/Lab/Aigis/aigis-workshop/test/UnitInfo.json', 'utf8'));
            await this.collectionService.updateIndex(updateCommand.remarks);
            return 'ok';
        } catch (ex) {
            throw new HttpException(ex, 400);
        }

    }
}
