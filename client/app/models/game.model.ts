export type Player = {
    id: string;
    name: string;
    lives: number;
    isMod: boolean;
}

export type Game = {
    players?: Player[];
    settings: Settings;
    currentRound?: number;
    currentPhase?: "lobby" | "inRound" | "voting"
    votes?: VoteMap
    questionLog?: QuestionLog[];
    usedQuestions?: [];
}

type VoteMap = {
    [voterSocketId: string]: string;
}

export type QuestionLog = {
    questionId: number;
    playerName: string;
    playerAnswer?: string;
}

export type Settings = {
    roundTime: number;
    maxLives: number;
}

export type Question = {
    question: string;
    answer: string | number | boolean;
}