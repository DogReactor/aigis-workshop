import { Document } from 'mongoose';
import { UserAuthority } from '../constants';

export interface User extends Document {
    username: string;
    password: string;
    mail: string;
    nickname: string;
    sign: string;
    authorities: [UserAuthority];
    qq?: string;
}