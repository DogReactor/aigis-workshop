
import * as mongoose from 'mongoose';
import { CreateSectionDto, CreateFileInfoDto, CreateCommitDto, CreateFileDto, StoreKeys } from './dto/assets.dto';
import { ObjectId } from 'bson';

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

sectionSchema.methods.getCommit = function (id: ObjectId) {

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