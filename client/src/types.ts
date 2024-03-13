
export interface IMessage {
    text: string;
    user: string;
    room: string;
}

export interface IMessages {
    messages: IMessage[];
}