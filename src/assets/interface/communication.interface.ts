interface IUpdateInfo {
    fileListUrl: string;
    cardsInfos: string;
}

export class UpdateInfo implements IUpdateInfo {
    readonly fileListUrl: string;
    readonly cardsInfos: string;
}
