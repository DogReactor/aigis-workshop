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
                const obj = this.jwt.Verify(req.query.token) as any;
                if (!req.query.token || !obj) throw Constants.TOKEN_ERROR;
                if (!obj._id || !obj.password) throw Constants.TOKEN_ERROR;
                const user = await this.usersService.FindUser(obj._id, true);
                if (!user || user.password !== obj.password) throw Constants.TOKEN_ERROR;

                req.body.token = obj;
                req.body.user = user;
                next();
            } catch (err) {
                res.status(400).send(new BadRequestMessage(err));
            }
        };
    }
}