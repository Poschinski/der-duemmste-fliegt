export type Player = {
    id: number;
    name: string;
    lives: number;
    isMod: boolean;
}

export type Game = {
    players?: Player[];
    settings: Settings;
    currentRound?: number;
    votes?: VoteMap
}

type VoteMap = {
    [voterSocketId: string]: string;
}


export type Settings = {
    roundTime: number;
    maxLives: number;
}

export type Question = {
    question: string;
    answer: string | number | boolean;
}