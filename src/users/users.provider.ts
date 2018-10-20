import { Connection } from 'mongoose';
import { UsersSchema } from './schema/users.schema';
import { Constants } from '../constants';

export const UsersProvider = [
    {
        provide: Constants.UserModelToken,
        useFactory: (connection: Connection) => connection.model('user', UsersSchema),
        inject: [Constants.DbConnectionToken],
    },
];
