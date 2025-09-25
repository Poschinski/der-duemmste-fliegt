const lobbies = {}; 

import { getQuestion } from "./questionService.js";

export function createLobby(socketId) {
  const lobbyId = Math.random().toString(36).slice(2, 8).toUpperCase();
  const moderatorId = crypto.randomUUID();

  lobbies[lobbyId] = {
    id: lobbyId,
    moderatorId,
    settings: {
        maxLives: 3,
        roundTime: 180,
    },
    users: {
      [moderatorId]: {
        id: moderatorId,
        socketId: socketId,
        role: "moderator",
      }
    },
    phase: "waiting", // waiting | question | voting | result
    currentQuestion: null,
    currentCorrectAnswer: null,
    currentAnswers: [],
    usedQuestions: [],
    votes: [],
    timer: null
  };

  return { lobbyId, moderatorId };
}

export function getLobby(lobbyId) {
  return lobbies[lobbyId];
}

export function joinLobby(lobbyId, name, socketId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return null;

  const userId = crypto.randomUUID();
  lobby.users[userId] = {
    id: userId,
    name,
    socketId,
    role: "player",
    lives: lobby.settings.maxLives
  };

  return { lobby, userId };
}

export function leaveLobby(lobbyId, userId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return;
  delete lobby.users[userId];
}

export function reconnectUser(lobbyId, userId, socketId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return null;

  const user = lobby.users[userId];
  if (!user) return null;

  user.socketId = socketId;
  return user;
}

export function loadQuestion(lobbyId, usedQuestions) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;
  const { question, index}  = getQuestion(usedQuestions);
  lobby.usedQuestions.push(index);
  lobby.currentQuestion = question.question;
  lobby.currentCorrectAnswer = question.answer;
  lobby.currentAnswers = [];
  return question;
}

export function chooseUser(lobbyId, lastUserId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return null;

  const validPlayers = Object.values(lobby.users).filter(u => u.role === "player" && u.lives > 0);

  validPlayers.sort((a, b) => a.id.localeCompare(b.id));

  if (!lastUserId) return validPlayers[0];
  const nextIndex = (validPlayers.indexOf(lastUserId) + 1) % validPlayers.length;
  return validPlayers[nextIndex];
}