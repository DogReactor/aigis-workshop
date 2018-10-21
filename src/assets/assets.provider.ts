import { Connection } from 'mongoose';
import { FileSchema, FileMetaSchema } from './assetsdb.schema';
import { Constants } from '../constants';

export const AssetsProviders = [
    {
        provide: Constants.FileMetaModelToken,
        useFactory: (connection: Connection) => connection.model('files_meta', FileMetaSchema, 'files_meta'),
        inject: [Constants.DbConnectionToken],
    },
    {
        provide: Constants.FilesModelToken,
        useFactory: (connection: Connection) => connection.model('text_repository', FileSchema, 'text_repository'),
        inject: [Constants.DbConnectionToken],
    },
];
