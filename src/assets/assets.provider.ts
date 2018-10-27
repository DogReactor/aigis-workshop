import { Connection } from 'mongoose';
import { FileSchema, ArchiveSchema, SectionSchema } from './assetsdb.schema';
import { Constants } from '../constants';

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
];
