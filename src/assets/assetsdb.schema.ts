
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
    author: mongoose.Schema.Types.ObjectId,
    time: Number,
    text: String,
    type: Number,
    origin: mongoose.Schema.Types.ObjectId,
});

export const SectionSchema = new mongoose.Schema({
    hash: String,
    parent: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    commits: [CommitSchema],
    rawCommit: mongoose.Schema.Types.ObjectId,
    lastPolishCommit: mongoose.Schema.Types.ObjectId,
    translated: Boolean,
    corrected: Boolean,
    polished: Boolean,
    lastPublish: Number,
    lastUpdated: Number,
    publish: { type: mongoose.Schema.Types.ObjectId, default: null },
    desc: { type: String, default: null },
    contractInfo: {
        type: {
            contractor: mongoose.Schema.Types.ObjectId,
            time: Number,
        },
        default: undefined,
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
    await this.save();
    return true;

    // Todo: 更新所属文件的相关字段
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

SectionSchema.methods.verifyContractor = function (id: ObjectId) {
    if (!this.contractInfo) return false;
    return this.contractInfo.contractor === id;
};

SectionSchema.statics.hasSection = async function (hash: string) {
    const r = this.findOne({ hash }).exec();
    if (r) return r;
    else return null;
};

SectionSchema.statics.createSection = async function (sectionDto: CreateSectionDto) {
    const section = new this(CreateSectionDto);
    await this.save();
    await section.addCommit({
        author: 'raw',
        time: (new Date()).getTime(),
        type: SectionStatus.Raw,
        origin: null,
    });
    return section;
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
    contractors: [{
        user: mongoose.Schema.Types.ObjectId,
        count: Number,
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
    let newFile = false;
    if (this.sections.length === 0) newFile = true;
    for (const sectionDto of sections) {
        // 尝试加入section
        let add = false;
        let section = await this.Model('section').findOne({ hash: sectionDto.hash }).exec() as Section;
        if (!section) {
            section = await this.Model('section').createSection(sectionDto); // 如果hash已经存在，那么这一步应该throw
            add = true;
        } else {
            if (newFile || !this.sections.find(v => sectionDto.hash === v)) {
                add = true;
            }
        }
        if (add) {
            this.sections.push(sectionDto.hash);
            count++;
            // section那边加上文件的信息，保证同步
            section.parent.push(this._id);
            await section.save();
        }
    }
    await this.save();
    return count;
};

FileSchema.methods.contractSections = async function (user: ObjectId, count: number) {
    let result = 0;
    for (const hash of this.sections) {
        if (count <= 0) break;
        const section = await this.Model('section').findOne({ hash }).exec() as Section;
        if (!section) { throw Constants.NO_SPECIFIED_SECTION; } // ????
        if (!section.contractInfo) {
            await section.contract(user);
            count--; result++;
        }
    }
    let contractor = this.contractors.find(v => user === v.user);
    if (!contractor) {
        contractor = {
            user,
            count: 0,
        };
        this.contractors.push(contractor);
    }
    contractor.count += result;
    await this.save();
    return result;
};

FileSchema.methods.getContractedSections = async function (user: ObjectId) {
    const sections = [];
    for (const hash of this.sections) {
        const section = await this.Model('section').findOne({ hash }).exec() as Section;
        if (!section) { throw Constants.NO_SPECIFIED_SECTION; } // ????
        if (section.verifyContractor(user)) sections.push(section);
    }
    return sections;

    // TODO: 只返回没翻译过的
};

FileSchema.methods.getSections = async function (start?: number, count?: number) {
    const sectionDocs = [];
    const end = count ? start + count : undefined;
    const sections = start ? this.sections.splice(start, end) : this.sections;
    for (const hash of sections) {
        const section = await this.Model('section').findOne({ hash }).exec() as Section;
        if (!section) { throw Constants.NO_SPECIFIED_SECTION; } // ???
        sectionDocs.push(section);
    }
    return sectionDocs;
};

FileSchema.methods.getFileInfo = async function (detail: boolean) {
    // 翻译过的 校对过的 润色过的 发布的
    // 发布的时候，要查询文件上次发布到现在为止新增的卡数 (绿色)
    // 以及修改过的卡数 (橙色)
};