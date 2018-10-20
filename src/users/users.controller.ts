import { Controller, Post, Get, Body, HttpException, UsePipes, ValidationPipe, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { JsonWebTokenService, JsonWebToken } from '../core/jwt.service';
import { LoginDto, RegDto, ModifyDto, ModifyRequestDto } from './users.model';
import { Constants, HttpSuccessMessage } from '../constants';

@Controller()
export class UsersController {

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JsonWebTokenService,
    ) {

    }
    // 不需要登陆状态
    @Post('/users/reg')
    @UsePipes(new ValidationPipe({ transform: false }))
    async postReg(@Body() reg: RegDto) {
        try {
            const user = await this.usersService.AddUser(reg);
            return new HttpSuccessMessage(await this.usersService.GenToken(user));
        } catch (err) {
            throw new HttpException(err, 400);
        }
    }

    @Post('/users/login')
    async postLogin(@Body() login: LoginDto) {
        // 返回token
        try {
            const user = await this.usersService.Login(login);
            if (user) {
                return new HttpSuccessMessage(await this.usersService.GenToken(user));
            } else {
                throw new HttpException(Constants.PASSWORD_USERNAME_ERROR, 400);
            }
        } catch (err) {
            throw new HttpException(err, 400);
        }

    }

    // 需要登陆状态，通过middleware
    @Put('/user/modify')
    @UsePipes(new ValidationPipe({ transform: false, skipMissingProperties: true }))
    async postModify(@Body() body: ModifyRequestDto) {
        const _id = body.token._id;
        try {
            const user = await this.usersService.ModifyUser(_id, body.update);
            return new HttpSuccessMessage(await this.usersService.GenToken(user));
        } catch (err) {
            throw new HttpException(err, 400);
        }
    }

    // 客户端在收到token之后应该立刻访问此接口
    @Post('/user/info')
    async getInfo(@Body() body: { token: JsonWebToken, user: any }) {
        return new HttpSuccessMessage(body.user);
    }
}