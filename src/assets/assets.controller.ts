import { Controller, Get, Post, Body, Res, Query, Param, HttpException } from '@nestjs/common';
import { SubmitWork } from './interface/service.interface';
import { AssetsService } from './assets.service';
import { Constants } from '../constants';
import { User } from 'users/users.interface';
@Controller('assets')
export class AssetsController {
    constructor(
        private readonly assetsService: AssetsService) { }

    // 提交工作
    @Post('sections')
    async submitWork(@Body('submitedWork') submitedWork: SubmitWork, @Body('user') user: User) {
        if (!submitedWork) throw new HttpException(Constants.ARGUMENTS_ERROR, 400);
        submitedWork.userId = user._id;
        try {
            return await this.assetsService.submitWork(submitedWork);
        } catch (ex) {
            throw new HttpException(ex, 400);
        }
    }
    // 获取文件列表
    @Get('files')
    async getFiles(@Query() query) {
        try {
            return await this.assetsService.getFiles(query.reg, query.skip, query.limit);
        } catch (ex) {
            throw new HttpException(ex, 400);
        }
    }
    // 获取文件详情
    @Get('file/:id')
    async getFile(@Param('id') id) {
        try {
            return await this.assetsService.getFile(id);
        } catch (ex) {
            throw new HttpException(ex, 400);
        }
    }

    // 获取Section
    @Get('file/:id/sections')
    async getSections(@Body() body, @Param('id') id, @Query() query) {
        try {
            if (query.contracted) {
                return await this.assetsService.getContractedSection(id, body.user._id);
            } else {
                return await this.assetsService.getSections(id, query.skip, query.limit);
            }
        } catch (ex) {
            throw new HttpException(ex, 400);
        }

    }
    @Post('file/:id/contract') // 圈文运动
    async contract(@Body() body, @Param('id') id) {
        try {
            return await this.assetsService.contract(id, body.user._id, body.count);
        } catch (ex) {
            throw new HttpException(ex, 400);
        }
    }
}
