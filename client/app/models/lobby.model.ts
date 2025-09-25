export type UserRole = "moderator" | "player";

export interface LobbyUser {
  id: string;
  socketId: string;
  role: UserRole;
  name?: string;   // Falls Client noch Name mitliefert
  lives?: number;
}

export type LobbyPhase = "waiting" | "question" | "voting" | "result";

export interface Lobby {
  id: string;
  moderatorId: string;
  settings: {
    maxLives: number;
    roundTime: number;
  };
  users: Record<string, LobbyUser>;
  phase: LobbyPhase;
  currentQuestion: string | null;
  currentCorrectAnswer: string | null;
  currentAnswers: any[]; // genauer typisieren, wenn klar
  usedQuestions: string[];
  votes: Record<string, string>; // voterId -> targetId
  timer: number | null;
}