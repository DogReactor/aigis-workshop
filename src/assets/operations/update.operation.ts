import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { HttpService } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { parseAL } from 'aigis-fuel';
import { CreateFileMetaDto, RawTextInfoDto, TextSectionDto } from '../dto/assets.dto';

export async function getFileList(fileListMark, httpService: HttpService): Promise<Map<string, string>> {
    const fileListPostfix = {
        N: '/2iofz514jeks1y44k7al2ostm43xj085',
        R: '/1fp32igvpoxnb521p9dqypak5cal0xv0',
    };
    const fileList: Map<string, string> = new Map();
    for (const flag of Object.keys(fileListPostfix)) {
        const fileListPath = fileListMark + fileListPostfix[flag];
        const csvBuffer = await downloadAsset(fileListPath, httpService);
        const key = 0xea ^ 0x30;
        let csvString = '';
        csvBuffer.forEach(b => csvString += String.fromCharCode(b ^ key));
        const csvData = csvString.split('\n');
        csvData.forEach(line => {
            const d = line.split(',');
            fileList.set(d[4], '/' + d[0] + '/' + d[1]);
        });
    }
    return Promise.resolve(fileList);
}

export async function fetchFiles(meta: CreateFileMetaDto, httpService: HttpService) {
    const rootDir = './raw_repo';
    fs.ensureDirSync(rootDir);
    try {
        for (const f of Object.keys(meta.filePaths)) {
            const refPath = meta.filePaths[f];
            const locatedDir = path.join(rootDir, f);
            const fileBuffer = await downloadAsset(refPath, httpService);
            parseAL(fileBuffer).Save(locatedDir);
        }
        return Promise.resolve(takeText(meta, rootDir));
    } catch (err) {
        console.log('Failed in fetching: ', err.Error);
        return Promise.reject([]);
    }
}

async function downloadAsset(filePath, httpService: HttpService): Promise<Buffer> {
    const reqOption = {
        method: 'GET',
        url: filePath,
        baseURL: 'http://assets.millennium-war.net/',
        responseType: 'arraybuffer',
    };
    return httpService.request(reqOption).pipe(map(r => r.data)).toPromise();
}

export function splitToSections(textInfo: RawTextInfoDto, remarks: object): Array<TextSectionDto> {
    const sectionsText = referSplitRule(textInfo.meta)(textInfo.text);
    const sections: Array<TextSectionDto> = [];
    sectionsText.forEach((originText, index) => {
        const md5 = crypto.createHash('md5');
        md5.update(originText);
        const section = new TextSectionDto();
        section.hash = md5.digest('hex');
        section.inFileId = index;
        section.origin = originText;
        section.superFile = textInfo.name;
        section.desc = '';
        sections.push(section);
    });
    attatchRemakrs(textInfo.meta, remarks, sections);
    return sections;
}

function attatchRemakrs(title: string, remarks: any, sections: Array<TextSectionDto>) {
    if (title === 'StatusText' && remarks.hasOwnProperty('CardsInfo')) {
        remarks.CardsInfo.Flavor.forEach(e => {
            for (let i = e.StartIndex; i < e.EndIndex; ++i) {
                sections[i].desc = 'Flavor talk ' + (i - e.StartIndex + 1) + ' of ' + e.Name;
            }
        });
    }
}

function referSplitRule(title: string): (text: string) => Array<string> {
    if (title.includes('HarlemEventText')) {
        return (text: string): Array<string> => text.split('\r\n\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
    }
    else if (/p.ev03/.test(title)) {
        return (text: string): Array<string> => {
            const lines = text.split('\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
            const nameIndex = lines.findIndex(t => /^「/.test(t));
            const name = lines[nameIndex - 1];
            return lines.filter(txt => txt !== name)
                .map(talk => /^「/.test(talk) ? name + '\r\n' + talk : talk);
        };
    }
    else if (/BattleTalkEvent/.test(title)) {
        return (text: string): Array<string> => {
            const lines = text.split('\r\n').filter(e => e !== String.fromCharCode(65279)).slice(1);
            const sections = [];
            for (let i = 0; i < lines.length; i += 2) {
                sections.push(lines.slice(i, i + 2).join('\r\n'));
            }
            return sections;
        };
    }
    else {
        return (text: string): Array<string> => text.split('\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
    }
}

function takeText(meta: CreateFileMetaDto, rootDir: string) {
    const rawTexts: Array<RawTextInfoDto> = [];
    if (meta.title === 'paev03' || meta.title === 'pcev03' || meta.title === 'prev03') {
        const fileDir = path.join(rootDir, meta.title);
        const actDirs = fs.readdirSync(fileDir);
        actDirs.forEach((dir, index) => {
            const text = fs.readFileSync(path.join(fileDir, dir, '_evtxt.txt'), 'utf8');
            rawTexts.push(new RawTextInfoDto(meta.title, dir, text, meta.reincarnation));
        });
        fs.remove(fileDir);
    }
    else if (meta.title === 'BattleTalkEvent') {
        const actDirs = fs.readdirSync(rootDir);
        actDirs.forEach(dir => {
            if (dir.includes(meta.title)) {
                const text = fs.readFileSync(path.join(rootDir, dir, 'BattleTalkEvent.txt'), 'utf8');
                rawTexts.push(new RawTextInfoDto(meta.title, dir, text, meta.reincarnation));
                fs.remove(dir);
            }
        });
    }
    else {
        const filesExposed = fs.readdirSync(rootDir);
        filesExposed.forEach(f => {
            const p = path.join(rootDir, f);
            if (f.split('.')[0].includes(meta.title) && fs.statSync(p).isFile()) {
                const text = fs.readFileSync(p, 'utf8');
                rawTexts.push(new RawTextInfoDto(meta.title, f.split('.')[0], text, meta.reincarnation));
                fs.remove(p);
            }
        });
    }
    return rawTexts;
}