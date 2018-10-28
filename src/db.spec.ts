import { ObjectId } from 'bson';
import * as mongoose from 'mongoose';
import { FileSchema } from './assets/schemas/file.schema';
import { SectionSchema } from './assets/schemas/section.schema';
import { FileModel, SectionModel } from './assets/interface/assets.interface';
import { FileType, SectionStatus } from './constants';
async function main() {
    const connection = await mongoose.connect('mongodb://localhost:27017/test', {
        useNewUrlParser: true,
    });
    const FileModel = connection.model('file', FileSchema) as FileModel;
    const SectionModel = connection.model('section', SectionSchema) as SectionModel;

    // 测试： 获取或创建文件
    const file = await FileModel.createFile({
        name: 'test2',
        assetsPath: 'asdfas123f/asds1',
        type: FileType.Section,
    }, true);

    if (file) {
        // 测试：向文件合并Sections
        const count = await file.mergeSections([
            {
                originText: 'fuckyouandme',
            },
            {
                originText: 'fuckyou',
            },
        ]);
        console.log(count);

        // 测试： 获取该文件的所有Section
        const sections = await file.getSections();
        console.log(sections);

        // 测试： 向第一个Section添加一个翻译
        const section = sections[0];

        const rawCommit = section.getCommit(section.rawCommit);
        await section.addCommit({
            author: new ObjectId(555),
            time: (new Date()).getTime(),
            type: SectionStatus.Translated,
            text: '草（中国语)',
            originCommit: rawCommit._id,
        });
    }
}
main();