import * as path from 'path';
import { FileType } from '../../constants';
import { AL } from 'aigis-fuel';
import { CreateSectionDto } from '../dto/assets.dto';




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
        const lines = rawText.text.split('\r\n').filter(e => e !== String.fromCharCode(65279));
        for (let i = 0; i < lines.length; i += 2) {
            sections.push(new CreateSectionDto(lines[i], `*${lines[i + 1]}*`));
        }
    }
    else if (/^Harlem[a-zA-Z]*Text/.test(rawText.name)) {
        const segs = rawText.text.split('\r\n\r\n').filter(e => e !== '' && e !== String.fromCharCode(65279));
        const descMap = new Map();
        segs.forEach(seg => {
            seg = seg.trim();
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
    else {
        sections = rawText.text.split('\r\n')
            .filter(e => e !== '' && e !== String.fromCharCode(65279))
            .map(s => new CreateSectionDto(s));
    }
    return sections;
}

export function takeText(fileName: string, ALData: AL): Array<{ name: string, text: string, fileType: FileType }> {
    let rawTexts: Array<{ name: string, text: string, fileType: FileType }> = [];
    function filterFutile() {
        if (/^p.ev03/.test(fileName)) {
            rawTexts = rawTexts.filter(e => e.name.endsWith('_evtxt.atb'));
        }
    }

    switch (ALData.Head) {
        case 'ALAR':
            for (const subAAR of ALData.Files) {
                const nextFileName = path.join(fileName.replace('.aar', ''), subAAR.Name);
                if (path.extname(subAAR.Name) !== '.txt') {
                    rawTexts = rawTexts.concat(takeText(nextFileName, subAAR.Content));
                } else {
                    rawTexts.push({
                        name: nextFileName,
                        text: subAAR.Content.Content,
                        fileType: FileType.TXT,
                    });
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
