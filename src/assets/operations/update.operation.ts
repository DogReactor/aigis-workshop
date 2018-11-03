import * as path from 'path';
import { FileType } from '../../constants';
import { HttpService } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { parseAL, AL } from 'aigis-fuel';
import { CreateSectionDto } from '../dto/assets.dto';

export async function getFileList(fileListMark, httpService: HttpService): Promise<Array<[string, string]>> {
    const fileListPostfix = {
        N: '/2iofz514jeks1y44k7al2ostm43xj085',
        R: '/1fp32igvpoxnb521p9dqypak5cal0xv0',
    };
    const fileList: Array<[string, string]> = [];
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
                if (d[4]) {
                    fileList.push([d[4], '/' + d[0] + '/' + d[1]]);
                }
            });
        } catch (err) {
            console.log('Err in fetching files list:\n', err);
        }
    }
    return Promise.resolve(fileList);
}

export async function fetchFile(fileName: string, refPath: string, httpService: HttpService):
                Promise<Array<{ name: string, text: string, fileType: FileType }>> {
    try {
        const fileBuffer = await downloadAsset(refPath, httpService);
        const al = parseAL(fileBuffer);
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

export function splitToSections(rawText: { name: string, text: string }, remarks: any): Array<CreateSectionDto> {
    let sections: Array<CreateSectionDto> = [];
    if (/^p.ev03/.test(rawText.name)) {
        const lines = rawText.text.split('\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
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
    else if (/^BattleTalkEvent/.test(rawText.name)) {
        const lines = rawText.text.split('\r\n').filter(e => e !== String.fromCharCode(65279)).slice(1);
        for (let i = 0; i < lines.length; i += 2) {
            sections.push(new CreateSectionDto(lines[0], `*${lines[i + 1]}*`));
        }
    }
    else if (/^Harlem[a-zA-Z]?Text/.test(rawText.name)) {
        const segs = rawText.text.split('\r\n\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
        const descMap = new Map();
        segs.forEach(seg => {
            if (seg.startsWith('＠')) {
                const name = seg.split('\r\n')[0].split('＠')[1];
                const talk = seg.split('\r\n').slice(1).join('\r\n');
                descMap.set(name, '');
                descMap.set(talk, `(＠)*${name}*`);
            } else {
                descMap.set(seg, '');
            }
        });
        descMap.forEach((v, k) => sections.push(new CreateSectionDto(k, v)));
    }
    else if (remarks && /^StatusText/.test(rawText.name) && remarks.hasOwnProperty('CardsInfo')) {
        const lines = rawText.text.split('\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
        const desc = lines.map(l => '');
        remarks.CardsInfo.Flavor.forEach(e => {
            for (let i = e.StartIndex; i < e.EndIndex; ++i) {
                desc[i] = `*${e.Name}*`;
            }
        });
        lines.forEach((l, i) => {
            sections.push(new CreateSectionDto(l, desc[i]));
        });
    }
    else {
        sections = rawText.text.split('\r\n')
            .filter(e => e !== '' && e !== String.fromCharCode(65279))
            .map(s => new CreateSectionDto(s));
    }
    return sections;
}

function takeText(fileName: string, ALData: AL): Array<{ name: string, text: string, fileType: FileType }> {
    let rawTexts: Array<{ name: string, text: string, fileType: FileType }> = [];
    function filterFutile() {
        if (/^p.ev03/.test(fileName)) {
            rawTexts = rawTexts.filter(e => e.name.endsWith('_evtxt.atb'));
        }
    }

    switch (ALData.Head) {
        case 'ALAR':
            for (const subAAR of ALData.Files) {
                if (path.extname(subAAR.Name) !== '.txt') {
                    rawTexts = rawTexts.concat(takeText(path.join(path.basename(fileName, '.aar'), subAAR.Name), subAAR.Content));
                } else {
                    rawTexts.push({
                        name: path.join(path.basename(fileName, '.aar'), subAAR.Name),
                        text: subAAR.Content.Content,
                         fileType: FileType.TXT });
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
                rawTexts.push({ name: fileName, text: content, fileType: FileType.Section });
            }
        default:
            break;
    }
    return rawTexts;

}