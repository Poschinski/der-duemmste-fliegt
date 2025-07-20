import type { Player } from "./player.model";


export enum GameStatus {
  LOBBY = 'in_lobby', //  ROOM IS IN LOBBY
  READY = 'in_ready', // A GAME IS READY TO START (JUST AFTER LOBBY OR AFTER VOTING)
  VOTING_ACTIVE = 'in_voting', // ROOM IS WAITING FOR PLAYERS TO VOTE
  VOTING_RESULTS = 'in_voting_results', // VOTING RESULTS ARE SHOWN
  END = 'in_end', // GAME HAS ENDED
}

export type Game = {
    id: string;
    players: Player[];
    settings: Settings;
    status: GameStatus;
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