import { Connection } from 'mongoose';
import { FileSchema, FileMetaSchema } from './assetsdb.schema';
import { Constants } from '../constants';

export const AssetsProviders = [
    {
        provide: Constants.FileMetaModelToken,
        useFactory: (connection: Connection) => connection.model('filemeta', FileMetaSchema, ),
        inject: [Constants.DbConnectionToken],
    },
    {
        provide: Constants.FilesModelToken,
        useFactory: (connection: Connection) => connection.model('text', FileSchema),
        inject: [Constants.DbConnectionToken],
    },
];
