import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { HttpService } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { parseAL, AL } from 'aigis-fuel';
import { CreateSectionDto, CreateFileDto, CreateFileInfoDto } from '../dto/assets.dto';
import { FileModel } from 'assets/interface/assets.interface';
import { Model } from 'mongoose';

export async function getFileList(fileListMark, httpService: HttpService): Promise<Map<string, string>> {
    const fileListPostfix = {
        N: '/2iofz514jeks1y44k7al2ostm43xj085',
        R: '/1fp32igvpoxnb521p9dqypak5cal0xv0',
    };
    const fileList: Map<string, string> = new Map();
    for (const flag of Object.keys(fileListPostfix)) {
        try {
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
        } catch (err) {
            console.log('Err in fetching files list:\n', err);
        }
    }
    return Promise.resolve(fileList);
}

export async function fetchFile(fileName: string, refPath: string, httpService: HttpService): Promise<Array<{ name: string, text: string }>> {
    try {
        const fileBuffer = await downloadAsset(refPath, httpService);
        const al = parseAL(fileBuffer)
        const texts = await takeText(fileName, al);
        return texts;
    } catch (err) {
        console.log('Failed in fetching: ', err);
        return Promise.reject(err);
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

export function splitToSections(doc: { name: string, text: string }): Array<CreateSectionDto> {
    const sections: Array<CreateSectionDto>  = [];
    if (/^p.ev03/.test(doc.name)) {
        const lines = doc.text.split('\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
        const descMap = new Map();
        lines.forEach((line, row) => {
            if (/^「/.test(line)) {
                descMap.set(line, `*${lines[row - 1]}*`);
            } else {
                descMap.set(line, '');
            }
        });
        descMap.forEach((v, k) => sections.push(new CreateSectionDto(k, v)));
    }
    else if (/^BattleTalkEvent/.test(doc.name)) {
        const lines = doc.text.split('\r\n').filter(e => e !== String.fromCharCode(65279)).slice(1);
        for (let i = 0; i < lines.length; i += 2) {
            sections.push(new CreateSectionDto(lines[0], `*${lines[i + 1]}*`));
        }
    }
    else if (/^Harlem[a-zA-Z]?Text/.test(doc.name)) {
        const segs= doc.text.split('\r\n\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
        segs.forEach(seg=>{
            if (seg.startsWith('＠')) {
                const name = seg.split('\r\n')[0].split('＠')[1];
                const talk = seg.split('\r\n').slice(1).join('\r\n');
                sections.push(new CreateSectionDto(talk, `(＠)*${name}*`));
            } else {
                sections.push(new CreateSectionDto(seg));
            }
        });
    }
    return sections;
}

export function attachRemarks(title: string, sections: Array<CreateSectionDto>, remarks: any): Array<CreateSectionDto> {

    let remarkedSections = null;
    if (remarks) {
        if (title === 'StatusText' && remarks.hasOwnProperty('CardsInfo')) {
            remarkedSections = sections.map(s => s);
            remarks.CardsInfo.Flavor.forEach(e => {
                for (let i = e.StartIndex; i < e.EndIndex; ++i) {
                    remarkedSections[i].desc = 'Flavor talk ' + (i - e.StartIndex + 1) + ' of ' + e.Name;
                }
            });
        }
    }
    return remarkedSections || sections;
}

function referSplitRule(title: string): (text: string) => Array<string> {
    if (/^Harlem[a-zA-Z]?Text/.test(title)) {
        return (text: string): Array<string> => text.split('\r\n\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
    }
    else if (/^p.ev03/.test(title)) {
        return (text) => {
            const lines = text.split('\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
            const nameIndex = lines.findIndex(t => /^「/.test(t));
            const name = lines[nameIndex - 1];
            return lines.filter(txt => txt !== name)
                .map(talk => /^「/.test(talk) ? name + '\r\n' + talk : talk);
        };
    }
    else if (/^BattleTalkEvent/.test(title)) {
        return (text) => {

            return sections;
        };
    }
    else {
        return (text) => text.split('\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
    }
}

function takeText(fileName: string, ALData: AL): Array<{ name: string, text: string }> {
    let rawTexts: Array<{ name: string, text: string }> = [];
    function filterFutile() {
        if (/^p.ev03/.test(fileName)) {
            rawTexts = rawTexts.filter(e => e.name.endsWith('_evtxt.atb'));
        }
    }

    switch (ALData.Head) {
        case 'ALAR':
            for (const subAAR of ALData.entry) {
                if (path.extname(subAAR.Name) !== '.txt') {
                    rawTexts = rawTexts.concat(takeText(path.join(path.basename(fileName, '.aar'), subAAR.Name), subAAR.Content));
                } else {
                    rawTexts.push({name: subAAR.Name, text: subAAR.Content});
                }
            }
            filterFutile();
            break;
        case 'ALTB':
            let content = '';
            for (const key in ALData.StringField) {
                if (ALData.StringField.hasOwnProperty(key)) {
                    const s = ALData.StringField[key].replace(/\n/g, '\\n');
                    content += s + '\r\n';
                }
            }
            content = content.trim();
            if (content) {
                rawTexts.push({ name: fileName, text: content });
            }
        default:
            break;
    }
    return rawTexts;

}