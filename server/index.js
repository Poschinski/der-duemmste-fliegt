const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const gameManager = require("./gameManager");
const { InMemorySessionStore } = require("./sessionStore");
const crypto = require('crypto');

const sessionStore = new InMemorySessionStore();

app.use(cors());

const server = http.createServer(app);

const randomId = () => crypto.randomBytes(8).toString("hex")

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
    console.log(`Session ID: ${session}`);
    if (session) {
      socket.sessionID = sessionID;
      socket.username = session.username;
      socket.isMod = session.isMod;
      socket.lobbyID = session.lobbyID;
      console.log(`User ${session.username} reconnected with session ID: ${socket.sessionID}`);
      return next();
    }
  }
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  const isMod = socket.handshake.auth.isMod;
  if (isMod === undefined) {
    return next(new Error("invalid isMod value"));
  }
  const lobbyID = socket.handshake.auth.lobbyID;
  socket.sessionID = randomId();
  socket.username = username;
  socket.isMod = isMod;
  socket.lobbyID = lobbyID;
  console.log(`User ${username} connected with session ID: ${socket.sessionID}`);
  next();
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

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

    socket.join(socket.lobbyID)
    console.log(`lobby ${socket.lobbyID}`);

    socket.on("create_lobby", ({ lobbyID }) => {
      gameManager.createLobby(lobbyID);
      // socket.join(lobbyID);
      socket.emit("lobby_created", { lobbyID });
    });
  
    socket.on("join_lobby", ({ lobbyID }) => {
      console.log(`User ${socket.username} joined lobby ${lobbyID}`);
      gameManager.joinLobby(lobbyID, { id: socket.sessionID, name: socket.username } );
  
      // socket.join(lobbyID);
  
      io.to(lobbyID).emit("receive_game_state", gameManager.getGameState(lobbyID));
    });

    socket.on("change_lobby_settings", ({ lobbyID, settings }) => {
      gameManager.updateLobbySettings(lobbyID, settings);
      io.to(lobbyID).emit("receive_game_state", gameManager.getGameState(lobbyID));
    });
  
    socket.on("cast_vote", ({ lobbyID, targetId }) => {
      gameManager.castVote(lobbyID, socket.sessionID, targetId);
      io.to(lobbyID).emit("receive_game_state", gameManager.getGameState(lobbyID));
    });
  
    socket.on("damage_player", ({ lobbyID, targetId }) => {
      gameManager.applyDamage(lobbyID, targetId);
      io.to(lobbyID).emit("receive_game_state", gameManager.getGameState(lobbyID));
    });
  
    socket.on("next_round", ({ lobbyID }) => {
      gameManager.advanceRound(lobbyID);
      io.to(lobbyID).emit("receive_game_state", gameManager.getGameState(lobbyID));
    });

    socket.on("get_game_state", ({ lobbyID }) => {
      io.to(lobbyID).emit("receive_game_state", gameManager.getGameState(lobbyID));
    });

    socket.on("update_game_state", (data) => {
      io.to(data.room).emit("receive_game_state", data);
    });
  
    socket.on("update_player_data", (data) => {
      io.to(data.room).emit("receive_player_data", data);
    });

    socket.on("navigate", ({ lobbyID }) => {
      console.log("navigating")
      io.to(lobbyID).emit("navigate_to");
    });

    socket.on("start_timer", ({ lobbyID, seconds }) => {
      console.log("started time for lobby " + lobbyID)
      timer = setInterval(() => {
        if (seconds <= 0) {
          clearInterval(timer);
        }
        io.to(lobbyID).emit("timer", seconds);
        seconds--;
      }, 1000);
    });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
