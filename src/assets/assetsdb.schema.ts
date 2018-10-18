
import * as mongoose from 'mongoose';

export const SectionSchema = new mongoose.Schema({
    hash: Number,
    file: String,
    status: Number,
    origin: String,
    translation: String,
    commits: Array,
    lastPublished: String,
    lastModified: String,
});

export const FileMetaSchema = new mongoose.Schema({
    fileListPaths: Array,
    fileSpecs: Array,
    filePaths: Object,
});