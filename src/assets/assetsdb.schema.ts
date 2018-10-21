
import * as mongoose from 'mongoose';
import * as dto from './dto/assets.dto';

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
    status: Number,
    origin: String,
    translation: String,
    commits: [CommitSchema],
    lastUpdated: String,
    desc: String,
    ordered: String,
});

export const FileSchema = new mongoose.Schema({
    name: String,
    meta: String,
    lastUpdated: String,
    lastPublished: String,
    translatedNumber: Number,
    correctedNumber: Number,
    publishedNumber: Number,
    orderedNumber: Number,
    sections: [SectionSchema],
});

export const FileMetaSchema = new mongoose.Schema({
    title: String,
    nameRegex: String,
    desc: String,
    filePaths: Object,
    reincarnation: Boolean,
});
