import { Injectable, Inject } from '@nestjs/common';
import { ModifyDto, RegDto, LoginDto } from './users.model';
import * as crypto from 'crypto';
import { Constants } from '../constants';
import { Model } from 'mongoose';
import { User } from './users.interface';
import { JsonWebTokenService } from '../core/jwt.service';

@Injectable()
export class UsersService {

    constructor(
        @Inject(Constants.UserModelToken) private readonly userModel: Model<User>,
        private readonly jwtService: JsonWebTokenService,
    ) {

    }
    public async FindUser(_id: string, withPassword: boolean = false) {
        if (withPassword) {
            return await this.userModel.findById(_id, { __v: false }).exec();
        } else {
            return await this.userModel.findById(_id, { password: false, __v: false }).exec();
        }

    }
    public async AddUser(user: RegDto) {
        // 先检查是否重复注册
        const usernameC = await this.userModel.findOne({ username: user.username }).exec();
        const mailC = await this.userModel.findOne({ mail: user.mail }).exec();

        if (usernameC) throw Constants.USERNAME_EXISTS;
        if (mailC) throw Constants.MAILWORD_EXISTS;
        // 密码记得md5一下
        user.password = crypto.createHash('md5').update(user.password).digest('hex');
        try {
            const createdUser = new this.userModel(user);
            createdUser.sign = crypto.createHash('md5').update(user.username).digest('hex');
            return await createdUser.save();
        }
        catch (err) {
            throw err;
        }
    }
    public async ModifyUser(_id: string, modify: ModifyDto) {
        if (modify.password === '') delete modify.password;
        if (modify.password !== undefined) {
            // 验证旧密码
            if (!modify.oldPassword) throw Constants.PLEASE_INPUT_OLDPASSWORD;
            modify.oldPassword = crypto.createHash('md5').update(modify.oldPassword).digest('hex');
            const user = await this.userModel.findById(_id);
            if (user.password !== modify.oldPassword) throw Constants.PASSWORD_ERROR;
            // 密码记得md5一下
            modify.password = crypto.createHash('md5').update(modify.password).digest('hex');
        }
        try {
            return await this.userModel.findByIdAndUpdate(_id, modify, { new: true });
        } catch (err) {
            throw err;
        }
    }
    public async Login(user: LoginDto) {
        try {
            // 密码记得md5一下·
            user.password = crypto.createHash('md5').update(user.password).digest('hex');
            const userInfo = await this.userModel.findOne(user);
            return userInfo;
        } catch (err) {
            throw err;
        }
    }

    public async FindUserBySign(sign: string) {
        return await this.userModel.findOne({ sign });
    }

    public async GenToken(user: User) {
        if (!user._id || !user.password) {
            user = await this.FindUser(user._id, true);
        }
        return this.jwtService.Sign({
            _id: user._id,
            password: user.password,
        });
    }
}