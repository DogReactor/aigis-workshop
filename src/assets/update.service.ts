import { Injectable, HttpService } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { map } from 'rxjs/operators';
import { parseAL } from 'aigis-fuel';
import { CreateFileMeta } from './assets.dto';

interface FileMeta extends Document {
    readonly fileSpecs: Array<string>;
    fileListPaths: Array<string>;
    filePaths: object;
  }

@Injectable()
export class UpdateService {
    constructor(
        private readonly httpService: HttpService,
        @InjectModel('FileMeta') private readonly fileMetaModel: Model<FileMeta>) { }
    async updateAllFiles(fileListMark: string, cardsInfo: object) {
        const rawAssetsDir = './rawtxt';
        const fileMeta = this.fileMetaModel(CreateFileMeta).findOne();
        const fileListPostfix = ['/1fp32igvpoxnb521p9dqypak5cal0xv0', '/2iofz514jeks1y44k7al2ostm43xj085'];

        try {
            const updatedFileList = new Set();
            for (let i = 0; i < fileListPostfix.length; ++i) {
                const fileListPath = fileListMark + fileListPostfix[i];
                if (fs.existsSync(configPath)) {
                    filesConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                } else {
                    return Promise.reject('Cannot find files config');
                }
                if (filesConfig.fileListPaths[i] === fileListPath) {
                    return Promise.reject('No need to update');
                } else {
                    filesConfig.fileListPaths[i] = fileListPath;
                }
                const reqOption = {
                    method: 'GET',
                    url: '',
                    baseURL: 'http://assets.millennium-war.net/',
                    responseType: 'arraybuffer',
                };

                reqOption.url = fileListPath + fileListPostfix[1];
                const csvBuffer = await this.httpService.request(reqOption).pipe(map(r => r.data)).toPromise();
                const key = 0xea ^ 0x30;
                let csvString = '';
                csvBuffer.forEach(b => csvString += String.fromCharCode(b ^ key));
                const csvData = csvString.split('\n');

                const requestUrls = [];
                filesConfig['spec-names'].forEach(nameReg => {
                    const reg = new RegExp(nameReg);
                    csvData.forEach(item => {
                        const d = item.split(',');
                        if (reg.test(d[4]) && filesConfig.filePaths[d[4]] !== '/' + d[0] + '/' + d[1]) {
                            updatedFileList.add(nameReg);
                            filesConfig.filePaths[d[4]] = '/' + d[0] + '/' + d[1];
                            requestUrls.push({
                                path: '/' + d[0] + '/' + d[1],
                                fileName: d[4],
                            });
                        }
                    });
                });

                fs.writeFile(configPath, JSON.stringify(filesConfig), err => Promise.reject(err));
                if (!fs.existsSync(rawAssetsDir)) {
                    fs.mkdirSync(rawAssetsDir);
                }
                for (const ref of requestUrls) {
                    reqOption.url = ref.path;
                    const fileResponse = await this.httpService.request(reqOption).pipe(map(r => r.data)).toPromise();
                    parseAL(fileResponse.data).Save(path.join(rawAssetsDir, ref.fileName));
                }
            }
            this.databaseService.updateDatabase(Array.from(updatedFileList));
        } catch (err) {
            return Promise.reject(err);
        }
        return Promise.resolve('Updated');
    }
}
