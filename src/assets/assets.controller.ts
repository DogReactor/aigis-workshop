import { Controller, Get, Post, Body, Res, Query, Param, HttpException, ParseIntPipe } from '@nestjs/common';
import { SubmitWork, UpdateCommand } from './interface/service.interface';
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
            console.log('err', ex);
            throw new HttpException(ex, 400);
        }
    }
    @Get('sections')
    async getSections(
        @Body('user') user: User,
        @Query('skip', new ParseIntPipe()) skip: number,
        @Query('limit', new ParseIntPipe()) limit: number,
        @Query('filter', new ParseIntPipe()) filter: number,
    ) {
        try {
            return await this.assetsService.getSectionsByUser(user._id, skip, limit, filter);
        } catch (ex) {
            throw new HttpException(ex, 400);
        }
    }
    @Get('sections/count')
    async getSectionsCount(@Body('user') user: User) {
        try {
            return await this.assetsService.getSectionsCountByUser(user._id);
        } catch (ex) {
            throw new HttpException(ex, 400);
        }
    }

    // 获取文件列表
    @Get('files')
    async getFiles(
        @Query('reg') reg: string,
        @Query('skip', new ParseIntPipe()) skip: number,
        @Query('limit', new ParseIntPipe()) limit: number,
        @Query('sort') sort: string,
        @Body() body,
    ) {
        try {
            return await this.assetsService.getFiles(reg, skip, limit, sort);
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
    async getFileSections(
        @Body() body,
        @Param('id') id,
        @Query('skip', new ParseIntPipe()) skip,
        @Query('limit', new ParseIntPipe()) limit,
        @Query('contracted', new ParseIntPipe()) contracted,
    ) {
        try {
            if (contracted === 1) {
                return await this.assetsService.getContractedSection(id, body.user._id);
            } else {
                return await this.assetsService.getSections(id, skip, limit);
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
