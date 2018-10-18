import { Injectable, Optional, Inject, HttpService } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateService } from './update.service';


@Injectable()
export class AssetsService {
    constructor(private readonly updateService: UpdateService) { }
    async updateAllFiles(fileListMark: string, cardsInfo: object) {
        return this.updateService.updateAllFiles(fileListMark, cardsInfo);
    }
}
