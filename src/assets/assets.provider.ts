import { Connection } from 'mongoose';
import { ArchiveSchema } from './schemas/archive.schema';
import { Constants } from '../constants';
import { FileSchema } from './schemas/file.schema';
import { SectionSchema } from './schemas/section.schema';
import { CollectionSchema } from './schemas/collection.schema';

export const AssetsProviders = [
    {
        provide: Constants.FilesModelToken,
        useFactory: (connection: Connection) => connection.model('file', FileSchema),
        inject: [Constants.DbConnectionToken],
    },
    {
        provide: Constants.ArchivesModelToken,
        useFactory: (connection: Connection) => connection.model('archive', ArchiveSchema),
        inject: [Constants.DbConnectionToken],
    },
    {
        provide: Constants.SectionsModelToken,
        useFactory: (connection: Connection) => connection.model('section', SectionSchema),
        inject: [Constants.DbConnectionToken],
    },
    {
        provide: Constants.CollectionsModelToken,
        useFactory: (connection: Connection) => connection.model('set', CollectionSchema),
        inject: [Constants.DbConnectionToken],
    },
];
