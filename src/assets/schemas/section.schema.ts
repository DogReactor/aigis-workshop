import * as mongoose from 'mongoose';
import { CreateSectionDto, CreateCommitDto, CreateFileDto, StoreKeys } from '../dto/assets.dto';
import { ObjectId } from 'bson';
import { SectionStatus, Constants } from '../../constants';
import { Section, Commit, SectionModel } from '../interface/assets.interface';

export const CommitSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    time: Number,
    text: String,
    type: Number,
    children: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
});

export const SectionSchema = new mongoose.Schema({
    hash: String,
    parent: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    commits: [CommitSchema],
    rawCommit: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    lastPolishCommit: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    translated: {
        type: Boolean,
        default: false,
    },
    corrected: {
        type: Boolean,
        default: false,
    },
    polished: {
        type: Boolean,
        default: false,
    },
    motified: {
        type: Boolean,
        default: false,
    },
    lastPublish: {
        type: Number,
        default: null,
    },
    lastUpdated: {
        type: Number,
        default: null,
    },
    publishedCommit: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    desc: { type: String, default: null },
    contractInfo: {
        type: {
            contractor: mongoose.Schema.Types.ObjectId,
            time: Number,
        },
        default: undefined,
    },
});

SectionSchema.index({ hash: 1 }, { unique: true });

SectionSchema.pre('save', function (next) {
    if (
        this.get('lastUpdated') &&
        this.get('lastPublish') &&
        this.get('lastPublish') < this.get('lastUpdated')
    ) {
        this.set('modified', true);
    }
    else this.set('modified', false);
    next();
});

SectionSchema.methods.getCommit = function (this: Section, id: ObjectId) {
    return this.commits.id(id);
};

SectionSchema.methods.publishCommit = async function (this: Section, id: ObjectId) {
    const commit = this.commits.id(id);
    if (!commit) {
        throw Constants.NO_SPECIFIED_COMMIT;
    }
    this.publishedCommit = id;
    this.lastPublish = (new Date()).getTime();
    await this.save();
    return true;
};

SectionSchema.methods.addCommit = async function (this: Section, commit: CreateCommitDto) {

    let origin: Commit = null;
    if (commit.originCommit && commit.author) {
        // 检查commit的origin是否存在
        origin = this.commits.id(commit.originCommit);
        if (!origin) throw Constants.NO_SPECIFIED_COMMIT;
        // 检查类型是否正确(初翻->原文 校对->初翻 润色->校对)
        if (commit.type - origin.type > 1) throw Constants.COMMIT_TYPE_ERROR;
        // 检查是否重复提交(每个人对每个commit只能有一个提交)
        const r = origin.children.find(v => v.toHexString() === commit.author);
        if (r) throw Constants.MULIT_COMMIT;
        // 如果是translate，验证是否承包过
        if (commit.type === SectionStatus.Translated && !this.verifyContractor(mongoose.Types.ObjectId(commit.author))) {

        }
    } else {
        if (commit.type !== SectionStatus.Raw || this.rawCommit) throw Constants.NO_SPECIFIED_COMMIT;
    }

    // 新建commit 只create不行，还要push进去，艹
    const commitDoc = this.commits.create(commit);
    this.commits.push(commitDoc);
    if (commit.type === SectionStatus.Polished) {
        this.set('lastUpdated', (new Date()).getTime());
    }
    // 给原commit 加上children 前面已经确保过原commit没有该作者提交的commit了
    if (origin) origin.children.push(commitDoc._id);

    // 给Section打标记 & 给拥有该Section的File做统计
    let updateType = null;
    switch (commitDoc.type) {
        case SectionStatus.Translated:
            if (!this.translated) { updateType = 'translated'; this.translated = true; }
            break;
        case SectionStatus.Corrected:
            if (!this.corrected) { updateType = 'corrected'; this.corrected = true; }
            break;
        case SectionStatus.Polished:
            if (!this.polished) { updateType = 'polished'; this.polished = true; }
            this.lastUpdated = (new Date()).getTime();
            this.lastPolishCommit = commitDoc._id;
            break;
    }

    if (updateType) {
        const updateobj: any = {};
        updateobj[updateType] = 1;
        for (const fileId of this.parent) {
            await this.model('file').findByIdAndUpdate(fileId, { $inc: updateobj }).exec();
        }
    }
    await this.save();
    return commitDoc;
};

SectionSchema.methods.contract = async function (this: Section, id: ObjectId) {
    this.contractInfo = {
        contractor: id,
        time: (new Date()).getTime(),
    };
    await this.save();
    return true;
};

SectionSchema.methods.verifyContractor = function (this: Section, id: ObjectId) {
    if (!this.contractInfo) return false;
    return this.contractInfo.contractor.toHexString() === id.toHexString();
};

SectionSchema.statics.hasSection = async function (this: SectionModel, hash: string) {
    const r = await this.findOne({ hash }).exec();
    if (r) return r;
    else return null;
};

SectionSchema.statics.createSection = async function (this: SectionModel, sectionDto: CreateSectionDto) {
    const section = new this(sectionDto) as Section;
    await section.save();
    const commitDoc = await section.addCommit({
        text: sectionDto.originText,
        time: (new Date()).getTime(),
        type: SectionStatus.Raw,
    });
    section.rawCommit = commitDoc._id;
    await section.save();
    return section;
};

SectionSchema.statics.getModified = async function (start?: number, count?: number) {
    // Todo: 维护一个新的 列表？ save那边标记为modified的统统把地址扔到这个列表里来。
};