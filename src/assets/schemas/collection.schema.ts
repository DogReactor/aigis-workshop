import * as mongoose from 'mongoose';
import { CollectionModel } from '../interface/assets.interface';
import { CreateCollectionDto } from '../dto/assets.dto';
export const CollectionSchema = new mongoose.Schema({
    token: String,
    name: String,
    type: String,
    sectionPointers: [
        {
        file: String,
        index: Array,
    }],
});

CollectionSchema.index({ token: 1 }, { unique: true });

CollectionSchema.statics.createCollection = async function (this: CollectionModel, file: CreateCollectionDto, force?: boolean) {
    let doc = null;
    if(force) {
        doc = await this.findOne({ token: file.token }).exec();
    }
    if (doc === null) doc = new this(file);
    try {
        await doc.save();
        return doc;
    } catch (err) {
        return null;
    }
};