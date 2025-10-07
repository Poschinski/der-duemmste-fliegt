import { 
  createLobby,
  joinLobby,
  getLobby,
  loadQuestion,
  chooseUser,
} from "./lobbies.js";

export function registerSocketHandlers(io, socket) {
  socket.on("createLobby", () => {
    const { lobbyId, moderatorId } = createLobby(socket.id);
    socket.join(lobbyId);

    socket.emit("lobbyCreated", {
      lobbyId,
      userId: moderatorId,
      role: "moderator",
    });

    console.log(`Lobby ${lobbyId} erstellt von ${moderatorId}`);
  });

  socket.on("changeSettings", ({ lobbyId, settings }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;
    Object.assign(lobby.settings, settings);
    if (settings.maxLives !== undefined) {
      Object.values(lobby.users).forEach((user) => {
        user.lives = Math.min(settings.maxLives);
      });
    }

    io.to(lobbyId).emit("userListUpdated", {
      users: Object.values(lobby.users).map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        lives: u.lives,
      })),
    });
    io.to(lobbyId).emit("settingsUpdated", { settings: lobby.settings });
  });

  socket.on("joinLobby", ({ lobbyId, name, userId }) => {
    let lobby = getLobby(lobbyId);
    if (!lobby) {
      socket.emit("error", { message: "Lobby nicht gefunden" });
      console.log(`Lobby ${lobbyId} nicht gefunden`);
      return;
    }

    let user;
    if (userId) {
      // Versuch: reconnect
      user = reconnectUser(lobbyId, userId, socket.id);
      if (!user) {
        // Falls User nicht existiert → neu anlegen
        const result = joinLobby(lobbyId, name, socket.id);
        user = result ? result.lobby.users[result.userId] : null;
        userId = result ? result.userId : null;
      }
    } else {
      // Neuer Spieler
      const result = joinLobby(lobbyId, name, socket.id);
      user = result ? result.lobby.users[result.userId] : null;
      userId = result ? result.userId : null;
    }

    if (!user) {
      socket.emit("error", { message: "Konnte User nicht erstellen" });
      return;
    }

    socket.join(lobbyId);

    console.log(`User ${user.name} (${user.id}) ist Lobby ${lobbyId} beigetreten`);

    // Antwort an Client
    // socket.emit("lobbyJoined", {
    //   lobbyId,
    //   userId,
    //   role: user.role,
    //   users: Object.values(lobby.users).map((u) => ({
    //     id: u.id,
    //     name: u.name,
    //     role: u.role,
    //     lives: u.lives,
    //   })),
    // });

    socket.emit("lobbyJoined", { lobby, userId });

    // Broadcast Userliste
    io.to(lobbyId).emit("userListUpdated", {
      users: Object.values(lobby.users).map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        lives: u.lives,
      })),
    });
  });

  socket.on("startLobby", ({ lobbyId }) => {
    const lobby = getLobby(lobbyId);
    console.log("lobby started: " + lobbyId);
    if (!lobby) return;

    lobby.phase = "questions";

    // io.to(lobbyId).emit("lobbyStarted", { phase: phase });

    io.to(lobbyId).emit("navigateTo", { to: `/game/${lobbyId}` });
  });

  socket.on("startRound", ({ lobbyId }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;
    let seconds = lobby.settings.roundTime;
    lobby.timer = setTimeout(() => {
      seconds--;
      io.to(lobbyId).emit("currentTimer"), { seconds: seconds};
    }, seconds);
  });


  socket.on("loadQuestion", ({ lobbyId, lastUserId }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;

    const question = loadQuestion(lobbyId, []);

    const user = chooseUser(lobbyId, lastUserId);
    if (!user) {
      socket.emit("errorMessage", { msg: "Kein Spieler zum Fragenstellen gefunden." });
      return;
    }

    // An alle Spieler (ohne Antwort)
    io.to(lobbyId).emit("newQuestion", {
      user: user.name,
      userId: user.id,
      question: question.question
    });

    // An Moderator (mit Antwort)
    const moderator = lobby.users[lobby.moderatorId];
    if (moderator && moderator.socketId) {
      io.to(moderator.socketId).emit("newQuestionModerator", question);
    }
  });

  socket.on("startVoting", ({ lobbyId }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;

    lobby.phase = "voting";
    io.to(lobbyId).emit("votingStarted", { phase: phase });

  });

  socket.on("castVote", ({ lobbyId, voterId, targetId }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;

    if (lobby.phase !== "voting") {
      socket.emit("errorMessage", { msg: "Voting ist gerade nicht erlaubt." });
      return;
    }

    if (lobby.votes[voterId]) {
      socket.emit("errorMessage", { msg: "Du hast schon gevoted." });
      return;
    }

    if (lobby.users[voterId].lives <= 0) {
      socket.emit("errorMessage", { msg: "Du bist raus und kannst nicht voten." });
      return;
    }

    lobby.votes[voterId] = targetId;

    const moderator = lobby.users[lobby.moderatorId];
    if (moderator && moderator.socketId) {
      io.to(moderator.socketId).emit("newQuestionModerator", question);
    }
    io.to(moderator.socketId).emit("votesUpdated", {
      totalVotes: Object.keys(lobby.votes).length,
      voters: Object.keys(lobby.votes),
    });
  })

  socket.on("endVoting", ({ lobbyId }) => {
    const lobby = getLobby(lobbyId);
    if (!lobby) return;
    
    const results = {};

    Object.values(lobby.votes).forEach((targetId) => {
      results[targetId] = (results[targetId] || 0) + 1;
    });

    const detailedVotes = Object.entries(lobby.votes).map(([voter, target]) => ({
      voter,
      target,
    }));

    io.to(lobbyId).emit("votingEnded", {
      results,        // { userId: Stimmenzahl }
      detailedVotes,  // [{ voter, target }]
    });

    lobby.votes = {};
  });

  socket.on("getLobby", ({ lobbyId }) => {
    const lobby = getLobby(lobbyId); 
    socket.emit("lobbyData", { lobby });
  });

}
