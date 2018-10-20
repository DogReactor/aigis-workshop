import { IsString, IsInt, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JsonWebToken } from '../core/jwt.service';

export class LoginDto {
    username: string;
    password: string;
}

export class RegDto {
    @IsString()
    username: string;
    @IsString()
    password: string;
    @IsEmail()
    mail: string;
    @IsString()
    nickname: string;
}
export class ModifyDto {
    @IsString()
    nickname?: string;
    @IsString()
    password?: string;

    oldPassword?: string;
}
export class ModifyRequestDto {
    token: JsonWebToken;

    @ValidateNested()
    @Type(() => ModifyDto)
    update: ModifyDto;
}
export class UserSessionDto {
    _id: string;
    ip?: string;
}