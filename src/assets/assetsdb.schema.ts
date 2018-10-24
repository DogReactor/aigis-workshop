
import * as mongoose from 'mongoose';
import { CreateSectionDto, CreateFileInfoDto, CreateCommitDto, CreateFileDto, StoreKeys } from './dto/assets.dto';
import { DBSection } from './interface/assets.interface';
import { ContractProposal } from './interface/service.interface';

export const CommitSchema = new mongoose.Schema({
    author: String,
    id: String,
    time: String,
    text: String,
    type: Number,
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
    contractInfo: {
        contractor: String,
        time: String,
    },
});

SectionSchema.methods.contract = function(proposal: ContractProposal): boolean {
    if (!this.contractInfo.contractor) {
        this.set('contractInfo.contractor', proposal.user.username);
        this.set('contractInfo.time', proposal.time);
        return true;
    }
    return false;
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

FileSchema.statics.createFile = async function(file: CreateFileDto, time?: string) {
    const doc = new this(file);
    doc.lastUpdated = time;
    doc.raw.forEach(s => s.lastUpdated = time);
    return doc.save();
};

FileSchema.methods.search = function(section: CreateSectionDto, attr: string) {
    if (this.hasOwnProperty(attr) && section.hasOwnProperty(attr)) {
        for (const store of StoreKeys) {
            const i = this[store].findIndex(s => s[attr] === section[attr]);
            if (i !== -1) {
                return { loc: store, no: i };
            }
        }
    }
    return null;
};

FileSchema.methods.getSection = function(token: { loc: string, no: number}): DBSection {
    if (token) {
        return this[token.loc][token.no];
    } else {
        return null;
    }
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
    return this.filesInfo[this.filesInfo.length - 1];
};
