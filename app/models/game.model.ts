export type Player = {
    id: number;
    name: string;
    lives: number;
}

export type Game = {
    players?: Player[];
    roundTime?: number;
    rounds?: number;
}

export type Question = {
    question: string;
    answer: string | number | boolean;
}