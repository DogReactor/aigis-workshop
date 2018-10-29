import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';
import { JsonWebTokenService, JsonWebToken } from './jwt.service';
import { Request, Response } from 'express';
import { BadRequestMessage } from '../constants';
import { UsersService } from '../users/users.service';
import { Constants } from '../constants';

@Injectable()
export class TokenVerifyMiddleware implements NestMiddleware {
    constructor(
        private readonly jwt: JsonWebTokenService,
        private readonly usersService: UsersService,
    ) {

    }
    resolve(...args: any[]): MiddlewareFunction {
        return async (req: Request, res: Response, next) => {
            try {
                // Todo:测试
                // if (!req.query.token || !(this.jwt.Verify(req.query.token))) throw Constants.NO_TOKEN;
                // const obj = this.jwt.Verify(req.body.token) as any;
                // if (!obj._id || !obj.password) throw Constants.TOKEN_ERROR;
                // const user = await this.usersService.FindUser(obj._id, true);
                // if (!user || user.password !== obj.password) throw Constants.TOKEN_ERROR;

                // req.body.token = obj;
                // req.body.user = user;
                req.body.user = {
                    _id: 'gbf is the best game',
                };
                next();
            } catch (err) {
                res.status(400).send(new BadRequestMessage(err));
            }
        };
    }
}