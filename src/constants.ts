export class HttpSuccessMessage {
    status: number = 200;
    message: any;
    constructor(message: any) {
        this.message = message;
    }
}

export class BadRequestMessage {
    status: number = 400;
    message: any;
    constructor(message: any) {
        this.message = message;
    }
}

export class Constants {
    public static get UserModelToken() { return 'UserModelToken'; }
    public static get ArchivesModelToken() { return 'ArchivesModelToken'; }
    public static get FilesModelToken() { return 'FilesModelToken'; }
    public static get CollectionsModelToken() { return 'CollectionsModelToken'; }
    public static get DbConnectionToken() { return 'DbConnectionToken'; }
    public static get SectionsModelToken() {
        return 'SectionsModelToken';
    }

    public static get PASSWORD_ERROR() { return '密码错误'; }
    public static get PASSWORD_USERNAME_ERROR() { return '用户名或密码错误'; }
    public static get PLEASE_INPUT_OLDPASSWORD() { return '请输入旧密码'; }

    public static get USERNAME_EXISTS() {
        return {
            message: '用户名已存在',
            code: 201,
        };
    }
    public static get MAILWORD_EXISTS() {
        return {
            message: '邮箱已存在',
            code: 202,
        };
    }

    public static get NO_TOKEN() { return '没有Token'; }
    public static get TOKEN_ERROR() {
        return {
            message: 'Token错误',
            code: 10,
        };
    }

    public static get NO_SPECIFIED_COMMIT() {
        return {
            message: '在指定的Section中找不到指定的Commit',
            code: 101,
        };
    }
    public static get NO_SPECIFIED_SECTION() { return '没有指定的Section'; }
    public static get MULIT_COMMIT() {
        return {
            message: '重复提交',
            code: 102,
        };
    }
    public static get COMMIT_TYPE_ERROR() {
        return {
            message: '提交类型错误',
            code: 103,
        };
    }
    public static get ARGUMENTS_ERROR() { return '参数错误'; }
    public static get FILE_NOT_FOUND() { return '文件不存在'; }
    public static get FAILED_UPDATE() { return '更新失败'; }
}

export enum WorkModel { Reading, Translating, Correcting, Embellishing, Publishing }

export enum UserAuthority { Translator, Corrector, Embellisher, Administor }

export enum SectionStatus { Raw, Translated, Corrected, Polished, Modified }

export enum ContractedMethods { random, all, select }

export enum FileType {
    Section,
    TXT,
}