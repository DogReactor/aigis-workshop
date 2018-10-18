import { Module } from '@nestjs/common';
import { SectionSchema, FileMetaSchema } from './assetsdb.schema';
import { AssetsService } from './assets.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [MongooseModule.forFeature([
        { name: 'Section', schema: SectionSchema },
        { name: 'FileMeta', schema: FileMetaSchema, collection: 'fileMeta' },
    ])],
    providers: [AssetsService],
    exports: [AssetsService],
})
export class AssetsModule { }
