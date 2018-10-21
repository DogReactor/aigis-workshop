
import * as mongoose from 'mongoose';
import { CreateSectionDto, CreateFileInfoDto, CreateCommitDto, RawTextInfoDto, CreateFileDto } from './dto/assets.dto';
import { DBFile, DBSection } from './interface/assets.interface';
import { Constants } from '../constants';

export const CommitSchema = new mongoose.Schema({
    author: String,
    id: String,
    time: String,
    text: String,
    kind: Number,
});
export const SectionSchema = new mongoose.Schema({
    inFileId: Number,
    hash: String,
    superFile: String,
    origin: String,
    text: String,
    commits: [CommitSchema],
    lastUpdated: String,
    desc: String,
    contractor: String,

});

SectionSchema.methods.commit = function(work: CreateCommitDto) {
    this.commits.push(work);
};

export const FileSchema = new mongoose.Schema({
    name: String,
    meta: String,
    lastUpdated: String,
    lastPublished: String,
    contractedNumber: Number,
    raw: [SectionSchema],
    translated: [SectionSchema],
    corrected: [SectionSchema],
    embellished: [SectionSchema],
    published: Boolean,
});

FileSchema.index({ meta: 1, published: 1 });

FileSchema.statics.createNewFile = async function(textInfo: RawTextInfoDto, sections: Array<CreateSectionDto>, time?: string) {
    const file = new this(new CreateFileDto());
    file.name = textInfo.name;
    file.meta = textInfo.meta;
    if (sections[0]) {
        file.lastUpdated = sections[0].lastUpdated;
    } else {
        file.lastUpdated = time || '';
    }
    file.addSections(sections);
    return await file.save();
};

FileSchema.methods.search = function(section: CreateSectionDto, attr: string) {
    if (this.hasOwnProperty(attr) && section.hasOwnProperty(attr)) {
        const stores = ['raw', 'translated', 'corrected', 'embellished'];
        for (const store of stores) {
            const i = this[store].findIndex(s => s[attr] === section[attr]);
            if (i !== -1) {
                return { loc: store, no: i };
            }
        }
    }
    return null;
};

FileSchema.methods.getSection = function(token: { loc: string, no: number}): DBSection {
    return this[token.loc][token.no];
};

FileSchema.methods.getFileInfo = function(): CreateFileInfoDto {
    const finfo = new CreateFileInfoDto(this.name);
    finfo.translatedNumber = this.translated.length;
    finfo.correctedNumber = this.corrected.length;
    finfo.embellishedNumber = this.embellished.length;
    finfo.sectionsNumber = finfo.translatedNumber + finfo.correctedNumber
                            + finfo.embellishedNumber + this.raw.length;
    finfo.contractedNumber = this.contractedNumber;
    finfo.published = this.published;

    return finfo;
};

FileSchema.methods.addSections = function(sections: Array<CreateSectionDto>) {
    this.raw = this.raw.concat(sections);
};

FileSchema.methods.resetSection = function(token: { loc: string, no: number }, section: CreateSectionDto) {
    const pre = this[token.loc][token.no];
    if (pre.contractor){
        this.contractedNumber -= 1;
    }
    this[token.loc].splice(token.no, 1);
    this.raw.push(section);
    this.published = false;
};

export const FileInfoSchema = new mongoose.Schema({
    name: String,
    sectionsNumber: Number,
    translatedNumber: Number,
    correctedNumber: Number,
    embellishedNumber: Number,
    contractedNumber: Number,
    published: Boolean,
});

export const FileMetaSchema = new mongoose.Schema({
    title: String,
    nameRegex: String,
    desc: String,
    filePaths: Object,
    filesInfo: [FileInfoSchema],
    reincarnation: Boolean,
});

FileMetaSchema.methods.updateInfo = function(newInfo: CreateFileInfoDto) {
    const pinfo = this.filesInfo.find(f => f.name === newInfo.name);
    if (pinfo) {
        pinfo.sectionsNumber = newInfo.sectionsNumber;
        pinfo.contractedNumber = newInfo.contractedNumber;
        pinfo.sectionsNumber = newInfo.sectionsNumber;
        pinfo.translatedNumber = newInfo.translatedNumber;
        pinfo.correctedNumber = newInfo.correctedNumber;
        pinfo.embellishedNumber = newInfo.embellishedNumber;
        pinfo.contractedNumber = newInfo.contractedNumber;
        pinfo.published = newInfo.published;
    } else {
        this.filesInfo.push(newInfo);
    }
};
