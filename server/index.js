const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const gameManager = require("./gameManager");
const { InMemorySessionStore } = require("./sessionStore");
const crypto = require("crypto");

const sessionStore = new InMemorySessionStore();

app.use(cors());

const server = http.createServer(app);

const randomId = () => crypto.randomBytes(8).toString("hex");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;

  if (sessionID) {
    const session = await sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.username = session.username;
      socket.isMod = session.isMod;
      socket.lobbyID = session.lobbyID || null;
      return next();
    }
  }

  const username = socket.handshake.auth.username;
  const isMod = socket.handshake.auth.isMod;

  if (!username || isMod === undefined) {
    return next(new Error("Invalid authentication data"));
  }

  socket.sessionID = randomId();
  socket.username = username;
  socket.isMod = isMod;
  socket.lobbyID = socket.handshake.auth.lobbyID || null;

  next();
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Speichere die Session
  sessionStore.saveSession(socket.sessionID, {
    username: socket.username,
    isMod: socket.isMod,
    lobbyID: socket.lobbyID,
  });

  socket.emit("session", {
    sessionID: socket.sessionID,
    username: socket.username,
    isMod: socket.isMod,
  });

  if (socket.lobbyID) {
    socket.join(socket.lobbyID);
    console.log(
      `User ${socket.username} wurde automatisch der Lobby ${socket.lobbyID} hinzugefügt.`
    );
    io.to(socket.lobbyID).emit(
      "receive_game_state",
      gameManager.getGameState(socket.lobbyID)
    );
  }

  socket.on("create_lobby", ({ lobbyID }) => {
    socket.join(lobbyID);
    gameManager.createLobby(lobbyID);
    console.log(`Lobby ${lobbyID} created by ${socket.username}`);

    // Session aktualisieren
    sessionStore.saveSession(socket.sessionID, {
      username: socket.username,
      isMod: socket.isMod,
      lobbyID,
    });

    socket.emit("lobby_created", { lobbyID });
  });

  socket.on("join_lobby", ({ lobbyID }) => {
    console.log(`User ${socket.username} joining lobby ${lobbyID}`);

    // Alle bisherigen Räume verlassen (außer privater Raum socket.id)
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.leave(room);
      }
    }

    socket.join(lobbyID);

    sessionStore.saveSession(socket.sessionID, {
      username: socket.username,
      isMod: socket.isMod,
      lobbyID,
    });

    gameManager.joinLobby(lobbyID, {
      id: socket.sessionID,
      name: socket.username,
    });

    io.to(lobbyID).emit(
      "receive_game_state",
      gameManager.getGameState(lobbyID)
    );
  });

  socket.on("change_lobby_settings", ({ lobbyID, settings }) => {
    gameManager.updateLobbySettings(lobbyID, settings);
    io.to(lobbyID).emit(
      "receive_game_state",
      gameManager.getGameState(lobbyID)
    );
  });

  socket.on("cast_vote", ({ lobbyID, targetId }) => {
    gameManager.castVote(lobbyID, socket.sessionID, targetId);
    io.to(lobbyID).emit(
      "receive_game_state",
      gameManager.getGameState(lobbyID)
    );
  });

  socket.on("damage_player", ({ lobbyID, targetId }) => {
    gameManager.applyDamage(lobbyID, targetId);
    io.to(lobbyID).emit(
      "receive_game_state",
      gameManager.getGameState(lobbyID)
    );
  });

  socket.on("log_question", ({ questionId, playerName, playerAnswer }) => {
    const lobbyID = getLobbyID(socket);
    if (!lobbyID) {
      console.error(`Socket ${socket.id} hat keine Lobby-ID.`);
      return;
    }
    gameManager.logQuestion(lobbyID, questionId, playerName, playerAnswer);
    io.to(lobbyID).emit(
      "receive_game_state",
      gameManager.getGameState(lobbyID)
    );
  });

  socket.on("next_round", () => {
    const lobbyID = getLobbyID(socket);
    if (!lobbyID) {
      console.error(`Socket ${socket.id} hat keine Lobby-ID.`);
      return;
    }
    gameManager.advanceRound(lobbyID);
    io.to(lobbyID).emit(
      "receive_game_state",
      gameManager.getGameState(lobbyID)
    );
  });

  socket.on("get_game_state", () => {
    const lobbyID = getLobbyID(socket);
    if (!lobbyID) {
      console.error(`Socket ${socket.id} hat keine Lobby-ID.`);
      return;
    }
    io.to(lobbyID).emit(
      "receive_game_state",
      gameManager.getGameState(lobbyID)
    );
    socket.emit("session", {
      sessionID: socket.sessionID,
      username: socket.username,
      isMod: socket.isMod,
    });
  });

  socket.on("update_game_state", (data) => {
    io.to(data.room).emit("receive_game_state", data);
  });

  socket.on("update_player_data", (data) => {
    io.to(data.room).emit("receive_player_data", data);
  });

  socket.on("navigate", () => {
    const lobbyID = getLobbyID(socket);
    if (lobbyID) {
      console.log(`Navigating in lobby ${lobbyID}`);
      io.to(lobbyID).emit("navigate_to");
    }
  });

  socket.on("start_timer", ({ lobbyID, seconds }) => {
    console.log(`Started timer for lobby ${lobbyID}`);

    let timer = setInterval(() => {
      if (seconds <= 0) {
        gameManager.setVotingPhase(lobbyID);
        io.to(lobbyID).emit(
          "receive_game_state",
          gameManager.getGameState(lobbyID)
        );
        clearInterval(timer);
      }
      io.to(lobbyID).emit("timer", seconds);
      seconds--;
    }, 1000);
  });
});

// Helper-Funktion, um die aktuelle Lobby eines Sockets zu holen
function getLobbyID(socket) {
  const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id);
  return rooms.length > 0 ? rooms[0] : null;
}

server.listen(3001, () => {
  console.log("SERVER IS RUNNING ON PORT 3001");
});
