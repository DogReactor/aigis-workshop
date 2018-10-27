
import * as mongoose from 'mongoose';
import { CreateSectionDto, CreateFileInfoDto, CreateCommitDto, CreateFileDto, StoreKeys } from './dto/assets.dto';
import { DBSection } from './interface/assets.interface';
import { ContractProposal } from './interface/service.interface';
import { ObjectId } from 'bson';

export const ArchiveSchema = new mongoose.Schema({
    dlName: String,
    files: [{
        name: String,
        hash: String,
        ref: ObjectId,
    }],
    path: String,
});

ArchiveSchema.methods.updateFileInfo = function (uname: string, uhash: string, uref: ObjectId, infoIndex: number) {
    if (infoIndex !== -1) {
        this.files[infoIndex].hash = uhash;
        this.files[infoIndex].ref = uref;
    } else {
        this.files.push({
            name: uname,
            hash: uhash,
            ref: uref,
        });
    }
    this.MarkModified('files');
    this.save();
};


export const commitSchema = new mongoose.Schema({
    author: ObjectId,
    time: Number,
    text: String,
    type: Number,
    origin: ObjectId,
});

export const sectionSchema = new mongoose.Schema({
    hash: String,
    commits: [commitSchema],
    rawCommit: ObjectId,
    lastCommit: ObjectId,
    publish: { type: ObjectId, default: null },
    desc: { type: String, default: null },
    contractInfo: {
        type: {
            contractor: ObjectId,
            time: Number,
        },
        default: null,
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

};

sectionSchema.methods.publishCommit = async function (id: ObjectId) {
    this.publish = ObjectId;
    try {
        await this.save();
        return true;
    } catch (err) {
        throw err;
    }
};

sectionSchema.methods.addCommit = async function (commit: CreateCommitDto) {
    this.commits.create(commit);
    try {
        await this.save();
        return true;
    } catch (err) {
        throw err;
    }
};

sectionSchema.methods.contract = async function (id: ObjectId) {
    this.contractInfo = {
        contractor: id,
        date: (new Date()).getTime(),
    };
    try {
        await this.save();
        return true;
    } catch (err) {
        throw err;
    }
};