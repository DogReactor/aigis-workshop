
import { Injectable, HttpService, Inject } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { FileType } from '../constants';
import { parseAL, AL } from 'aigis-fuel';
import * as fs from 'fs';
import * as path from 'path';

const cachePath = './cache';

@Injectable()
export class DownloaderService {
    private fileList: any;
    private fileListMark: string = '';
    constructor(
        private readonly httpService: HttpService,
    ) {
        if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath);
        } else {
            try {
                this.fileList = JSON.parse(fs.readFileSync(path.join(cachePath, 'file_list.json'), 'utf8'));
            } catch (err) { }
        }
    }
    async downloadAsset(filePath: string): Promise<Buffer> {
        const reqOption = {
            method: 'GET',
            url: filePath,
            baseURL: 'http://assets.millennium-war.net/',
            responseType: 'arraybuffer',
        };
        return this.httpService.request(reqOption).pipe(map(r => r.data)).toPromise();
    }
    async updateFilelist(fileListMark: string) {
        const fileListPostfix = {
            N: '/2iofz514jeks1y44k7al2ostm43xj085',
            R: '/1fp32igvpoxnb521p9dqypak5cal0xv0',
        };
        if (this.fileListMark === fileListMark) {
            return 'List has been updated';
        }
        const fileListObj: any = {};
        for (const flag of Object.keys(fileListPostfix)) {
            try {
                const fileListPath = fileListMark + fileListPostfix[flag];
                const csvBuffer = await this.downloadAsset(fileListPath);
                const key = 0xea ^ 0x30;
                let csvString = '';
                csvBuffer.forEach(b => csvString += String.fromCharCode(b ^ key));
                const csvData = csvString.split('\n');
                csvData.forEach(line => {
                    const d = line.split(',');
                    if (d[4]) {
                        fileListObj[d[4]] = `/${d[0]}/${d[1]}`;
                    }
                });
            } catch (err) {
                console.log('Err in fetching files list:\n', err);
            }
        }
        this.fileList = fileListObj;
        this.fileListMark = fileListMark;
        fs.writeFile(path.join(cachePath, 'file_list.json'), JSON.stringify(this.fileList), (err) => {
            if (err) {
                console.log(err);
            }
        });
        return this.fileList;
    }

    async fetchFile(fileName: string): Promise<AL> {
        try {
            const dlpath = this.fileList[fileName];
            const fileBuffer = await this.downloadAsset(dlpath);
            const al = parseAL(fileBuffer);
            return al;
        } catch (err) {
            console.log('Failed in fetching: ', err);
            return Promise.reject(err);
        }
    }

    async fetchFilesSet(checker): Promise<AL[]> {
        const files = Object.keys(this.fileList).filter(k => checker(k));
        return Promise.all(files.map(f => this.fetchFile(f)));
    }
}
