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
      currentRound: 1,
      votes: {}
    };
    return true;
  }
  return false; 
}

function updateLobbySettings(lobbyId, settings) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;
  lobby.settings = { ...lobby.settings, ...settings };
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
      isMod: player.isMod || false
    });
  }

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
  return lobby.player.lives;
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

function advanceRound(lobbyId) {
  const lobby = lobbies[lobbyId];
  if (!lobby) return false;
  lobby.currentRound += 1;
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
  castVote,
  applyDamage,
  getGameState,
  resetVotes,
  advanceRound,
  removePlayer,
  updateLobbySettings
};
