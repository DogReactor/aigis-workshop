import * as fs from 'fs-extra';
import * as path from 'path';

import { HttpService } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { parseAL } from 'aigis-fuel';
import { CreateSectionDto, CreateFileDto, CreateFileInfoDto } from '../dto/assets.dto';
import { DBFileMeta, DBFileModel } from 'assets/interface/assets.interface';

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

export async function fetchFile(file: string, refPath: string, httpService: HttpService): Promise<Array<{ name: string, text: string }>> {
    const rootDir = './raw_repo';
    fs.ensureDirSync(rootDir);
    try {
        const locatedDir = path.join(rootDir, file);
        const fileBuffer = await downloadAsset(refPath, httpService);
        parseAL(fileBuffer).Save(locatedDir);
        const texts = await takeText(file, rootDir);
        return Promise.resolve(texts);
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

export function splitToSections(textInfo: { name: string, text: string }): Array<CreateSectionDto> {
    const meta = path.dirname(textInfo.name);
    const sectionsText = referSplitRule(meta)(textInfo.text);
    const sections: Array<CreateSectionDto>
        = sectionsText.map((originText, index) => new CreateSectionDto(index + 1, originText, textInfo.name));
    return sections;
}

export function attachRemarks(title: string, sections: Array<CreateSectionDto>, remarks: any): Array<CreateSectionDto> {

    const remarkedSections = sections.map(s => s);
    if (remarks) {
        if (title === 'StatusText' && remarks.hasOwnProperty('CardsInfo')) {
            remarks.CardsInfo.Flavor.forEach(e => {
                for (let i = e.StartIndex; i < e.EndIndex; ++i) {
                    remarkedSections[i].desc = 'Flavor talk ' + (i - e.StartIndex + 1) + ' of ' + e.Name;
                }
            });
        }
    }
    return remarkedSections;
}

export async function updateDoc(file: CreateFileDto, meta: DBFileMeta, filesModel: DBFileModel, timestamp: string): Promise<CreateFileInfoDto> {
    try {
        let doc = await filesModel.findOne({ meta: file.meta, name: file.name }).exec();
        if (doc) {
            doc.lastUpdated = timestamp;
            for (const sec of file.raw) {
                sec.lastUpdated = timestamp;
                const secLoc = meta.reincarnation ? doc.search(sec, 'hash') : doc.search(sec, 'inFileId');
                const contraposition = doc.getSection(secLoc);
                if (!contraposition) {
                    doc.addSections([sec]);
                }
                else if (contraposition.hash === sec.hash && contraposition.inFileId === sec.inFileId) {
                    contraposition.lastUpdated = timestamp;
                    continue;
                }
                else if (contraposition.hash === sec.hash && contraposition.inFileId !== sec.inFileId && meta.reincarnation) {
                    contraposition.inFileId = sec.inFileId;
                    contraposition.lastUpdated = timestamp;
                }
                else if (contraposition.hash !== sec.hash && contraposition.inFileId === sec.inFileId && !meta.reincarnation) {
                    doc.resetSection(secLoc, sec);
                }
                doc.published = false;
            }
            doc.save();
        } else {
            doc = await filesModel.createFile(file, timestamp);
        }
        return Promise.resolve(doc.getFileInfo());
    } catch (err) {
        return Promise.reject(err);
    }
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
            const lines = text.split('\r\n').filter(e => e !== String.fromCharCode(65279)).slice(1);
            const sections = [];
            for (let i = 0; i < lines.length; i += 2) {
                sections.push(lines.slice(i, i + 2).join('\r\n'));
            }
            return sections;
        };
    }
    else {
        return (text) => text.split('\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
    }
}

async function takeText(file: string, rootDir: string): Promise<Array<{ name: string, text: string }>> {
    const rawTexts: Array<{ name: string, text: string }> = [];
    const fextname = path.extname(file);
    const fbasename = path.basename(file, fextname);
    function checkAndAppend(txtName, txt) {
        if (txt.trim()) {
            rawTexts.push({name: path.join(fbasename, txtName), text: txt});
        }
    }
    try {
        let fileDir = path.join(rootDir, fbasename);
        if (/^p.ev03/.test(file)) {
            const actDirs = fs.readdirSync(fileDir);
            actDirs.forEach(dir => {
                const text = fs.readFileSync(path.join(fileDir, dir, '_evtxt.txt'), 'utf8');
                checkAndAppend(dir, text);
            });
        }
        else if (/^BattleTalkEvent[0-9]+/.test(fbasename)) {
            const text = fs.readFileSync(path.join(fileDir, 'BattleTalkEvent.txt'), 'utf8');
            checkAndAppend(fbasename, text);
        }
        else if (fextname === '.aar') {
            const files = fs.readdirSync(fileDir);
            files.forEach(f => {
                const p = path.join(fileDir, f);
                if (fs.statSync(p).isFile() && path.extname(f) === '.txt') {
                    checkAndAppend(path.basename(f, '.txt'), fs.readFileSync(p, 'utf8'));
                }
            });
        }
        else {
            fileDir += '.txt';
            if (fs.statSync(fileDir).isFile()) {
                checkAndAppend(fbasename, fs.readFileSync(fileDir, 'utf8'));
            }
        }
        fs.remove(fileDir);
    } catch (err) {
        console.log('Err in taking texts\n', err);
        return Promise.reject(err);
    }
    return Promise.resolve(rawTexts);
}