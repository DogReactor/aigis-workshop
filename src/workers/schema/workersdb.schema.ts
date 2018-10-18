
import * as mongoose from 'mongoose';

export const WorkerSchema = new mongoose.Schema({
    token: String,
    account: String,
    password: String,
    name: String,
    invitedCode: String,
    authority: Array,
});