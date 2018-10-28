import * as mongoose from 'mongoose';
import { CreateSectionDto,  CreateCommitDto, CreateFileDto, StoreKeys } from '../dto/assets.dto';
import { ObjectId } from 'bson';
import { SectionStatus, Constants } from '../../constants';
import { Section, Commit, SectionModel } from '../interface/assets.interface';

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