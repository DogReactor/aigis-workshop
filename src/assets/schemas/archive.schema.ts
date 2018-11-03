import * as mongoose from 'mongoose';
import { CreateSectionDto, CreateCommitDto, CreateFileDto, CreateArchiveDto } from '../dto/assets.dto';
import { ObjectId } from 'bson';
import { SectionStatus, Constants } from '../../constants';
import { Section, Commit, SectionModel, ArchiveModel, Archive } from '../interface/assets.interface';

export const ArchiveSchema = new mongoose.Schema({
    dlName: String,
    files: [{
        name: String,
        hash: String,
        ref: ObjectId,
    }],
    path: String,
});

ArchiveSchema.statics.getArchive = async function (archiveDto: CreateArchiveDto) {
    let doc = await this.findOne({ dlName: archiveDto.dlName }).exec() as Archive;
    if (doc) {
        return doc;
    } else {
        doc = new this(archiveDto);
        return await doc.save();
    }
};

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
    this.markModified('files');
    try {
        await this.save();
        return Promise.resolve('ok');
    } catch (err) {
        return Promise.reject(err);
    }
};