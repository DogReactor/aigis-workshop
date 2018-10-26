import { Injectable } from '@nestjs/common';
import { UserAuthority } from '../constants';
import * as jwt from 'jsonwebtoken';

export interface JsonWebToken {
    _id: string;
    password: string;
    authorities: [UserAuthority];
}

@Injectable()
export class JsonWebTokenService {
    private sign = 'I have a dream.';

    public Sign(object: JsonWebToken) {
        return jwt.sign(object, this.sign, {
            expiresIn: '24h',
        });
    }
    public Verify(token: string) {
        try {
            return jwt.verify(token, this.sign);
        } catch (err) {
            return null;
        }
    }
}