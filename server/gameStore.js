/* abstract */ class MessageStore {
  saveMessage(lobby) {}
  findMessagesForUser(lobbyID) {}
}

class InMemoryMessageStore extends MessageStore {
  constructor() {
    super();
    this.lobbies = [];
  }

  saveLobby(lobby) {
    this.lobbies.push(lobby);
  }

  findLobby(lobbyID) {
    return this.lobbies.filter(
      ({ lobby }) => lobby.id === lobbyID
    );
  }
}

module.exports = {
  InMemoryMessageStore,
};
