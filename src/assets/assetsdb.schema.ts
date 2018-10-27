
import * as mongoose from 'mongoose';
import { CreateSectionDto, CreateFileInfoDto, CreateCommitDto, CreateFileDto, StoreKeys } from './dto/assets.dto';
import { ObjectId } from 'bson';
import { SectionStatus, Constants } from '../constants';
import { Section } from './interface/assets.interface';

export const ArchiveSchema = new mongoose.Schema({
    dlName: String,
    files: [{
        name: String,
        hash: String,
        ref: ObjectId,
    }],
    path: String,
});

ArchiveSchema.methods.updateFileInfo = async function (uname: string, uhash: string, uref: ObjectId, infoIndex: number) {
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
    try {
        await this.save();
        return true;
    } catch (err) {
        throw err;
    }
};

export const CommitSchema = new mongoose.Schema({
    author: ObjectId,
    time: Number,
    text: String,
    type: Number,
    origin: ObjectId,
});

export const SectionSchema = new mongoose.Schema({
    hash: String,
    commits: [CommitSchema],
    rawCommit: ObjectId,
    lastCommit: ObjectId,
    translated: Boolean,
    corrected: Boolean,
    polished: Boolean,
    lastPublish: Number,
    lastUpdated: Number,
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

SectionSchema.methods.contract = async function (proposal: ObjectId) {
    if (!this.contractInfo) {
        this.set('contractInfo.contractor', ObjectId);
        this.set('contractInfo.time', (new Date()).getTime());
        return true;
    }
    return false;
};

SectionSchema.methods.publishCommit = async function (id: ObjectId) {
    const commit = this.commits.id(id);
    if (commit) {
        this.set('publish', ObjectId);
    } else {
        throw Constants.NO_SPECIFIED_COMMIT;
    }

    try {
        await this.save();
        return true;
    } catch (err) {
        throw err;
    }
};

SectionSchema.methods.addCommit = async function (commit: CreateCommitDto) {
    this.commits.create(commit);
    if (commit.type === SectionStatus.Polished) {
        this.set('lastUpdated', (new Date()).getTime());
    }
    try {
        await this.save();
        return true;
    } catch (err) {
        throw err;
    }
};

SectionSchema.methods.contract = async function (id: ObjectId) {
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

SectionSchema.statics.hasSection = async function (hash: string) {
    const r = this.findOne({ hash }).exec();
    if (r) return r;
    else return null;
};

export const FileSchema = new mongoose.Schema({
    name: String,
    meta: String,
    lastUpdated: {
        type: Number,
        default: null,
    },
    lastPublished: {
        type: Number,
        default: null,
    },
    sections: [{
        type: String,
    }],
});

FileSchema.index({ meta: 1, published: 1 });

FileSchema.statics.createFile = function (file: CreateFileDto, time?: string) {
    const doc = new this(file);
    doc.lastUpdated = time;
    return doc;
};

FileSchema.methods.getPublishedText = async function () {
    const texts = [];
    for (const hash of this.sections) {
        const doc = await this.Model('section').findOne({ hash }).exec() as Section;
        const commit = doc.commits.id(doc.publish);
        texts.push(commit.text);
    }
    return texts;
};

FileSchema.methods.appendSections = async function (sections: Array<CreateSectionDto>) {
    let count = 0;
    for (const sectionDto of sections) {
        // 尝试加入section
        try {
            const section = new this.Model('section')(sectionDto);
            await section.save();   // 如果hash已经存在，那么这一步应该throw

            this.sections.push(section.hash); // 因为hash不存在，所以不需要考虑已经存在的事。
        } catch (err) {
            // 如果err.code是110000即hash重复，那么检查this.sections里是否包含该hash，如果没有就push
            if (!this.sections.find(v => sectionDto.hash === v)) {
                this.sections.push(sectionDto.hash);
            }
        }
        count++;
    }
    try {
        this.save();
        return count;
    } catch (err) {
        throw err;
    }
};