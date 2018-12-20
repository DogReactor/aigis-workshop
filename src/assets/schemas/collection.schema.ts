import * as mongoose from 'mongoose';
import { CollectionModel } from '../interface/assets.interface';
import { CreateCollectionDto } from '../dto/assets.dto';
export const CollectionSchema = new mongoose.Schema({
    token: String,  // 用于检测更新的标识
    name: String,   // 用于显示的名字，任务名或单位名
    type: String,   // 类型，任务或单位
    sectionPointers: [ // 这个里是指向每个file的sections序号的
        {
            file: String, // file在数据库里的name
            index: Array, // 需要的sections在这个file里的全部序号， [-1]表示全文件
        },
    ],
});

CollectionSchema.index({ token: 1 }, { unique: true });

CollectionSchema.statics.createCollection = async function (this: CollectionModel, file: CreateCollectionDto, force?: boolean) {
    let doc = await this.findOne({ token: file.token }).exec();
    try {
        if (doc.sectionPointers.length >= file.sectionPointers.length) {
            return doc;
        } else if (doc) {
            return await this.updateOne({ token: file.token }, file).exec();
        } else {
            doc = new this(file);
            return await doc.save();
        }
    } catch (err) {
        return Promise.reject(err);
    }

};