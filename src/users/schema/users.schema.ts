import * as mongoose from 'mongoose';

export const UsersSchema = new mongoose.Schema({
    username: String,
    password: String,
    mail: String,
    nickname: String,
    sign: String,
    qq: String,
});