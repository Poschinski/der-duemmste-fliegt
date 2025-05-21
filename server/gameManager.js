// RAM-basiertes Game-Management

const lobbies = {};

function createLobby(lobbyId, settings = {}) {
  if (!lobbies[lobbyId]) {
    lobbies[lobbyId] = {
      settings: {
        maxLives: settings.maxLives || 3,
        roundTime: settings.roundTime || 180,
      },
      players: [],
      currentRound: 0,
      currentPhase: "lobby",
      votes: {},
      questionLog: [],
    };
    return true;
  }
  return false; 
}

function updateLobbySettings(lobbyId, settings) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;
  lobby.settings = { ...lobby.settings, ...settings };
  if (settings.maxLives && lobby.players.length > 0) {
    lobby.players.forEach(player => {
      player.lives = settings.maxLives;
    });
  }
  return true;
}

function joinLobby(lobbyId, player) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;

  const alreadyJoined = lobby.players.find(p => p.id === player.id);
  if (!alreadyJoined) {
    lobby.players.push({
      id: player.id,
      name: player.name,
      lives: lobby.settings.maxLives,
    });
  }

  return true;
}

function setVotingPhase(lobbyId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;
  lobby.currentPhase = "voting";
  return true;
}

function castVote(lobbyId, voterId, targetId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;
  lobby.votes[voterId] = targetId;
  return true;
}

function applyDamage(lobbyId, playerId, amount = 1) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;

  const player = lobby.players.find(p => p.id === playerId);
  if (!player) return false;

  player.lives = Math.max(0, player.lives - amount);
  return player.lives;
}

function getGameState(lobbyId) {
  return lobbies[lobbyId] || null;
}

function resetVotes(lobbyId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;
  lobby.votes = {};
  return true;
}

function logQuestion(lobbyId, questionId, playerName, playerAnswer) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;
  lobby.questionLog.push({ questionId, playerName, playerAnswer });
  return true;
}

function advanceRound(lobbyId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;
  lobby.currentRound += 1;
  lobby.currentPhase = "inRound"
  lobby.questionLog = [];
  resetVotes(lobbyId);
  return lobby.currentRound;
}

function removePlayer(lobbyId, socketId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return;
  lobby.players = lobby.players.filter(p => p.id !== socketId);
}

module.exports = {
  createLobby,
  joinLobby,
  logQuestion,
  setVotingPhase,
  castVote,
  applyDamage,
  getGameState,
  resetVotes,
  logQuestion,
  advanceRound,
  removePlayer,
  updateLobbySettings
};
