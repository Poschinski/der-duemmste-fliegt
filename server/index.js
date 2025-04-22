const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const gameManager = require("./gameManager");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
  
    socket.on("join_lobby", ({ lobbyId, name, isMod }) => {
      console.log(`User ${name} joined lobby ${lobbyId}`);
      gameManager.createLobby(lobbyId); // idempotent
      gameManager.joinLobby(lobbyId, { id: socket.id, name, isMod });
  
      socket.join(lobbyId);
  
      // Broadcast updated state
      io.to(lobbyId).emit("receive_game_state", gameManager.getGameState(lobbyId));
    });

    socket.on("change_lobby_settings", ({ lobbyId, settings }) => {
      gameManager.updateLobbySettings(lobbyId, settings);
      io.to(lobbyId).emit("receive_game_state", gameManager.getGameState(lobbyId));
    });
  
    socket.on("cast_vote", ({ lobbyId, targetId }) => {
      gameManager.castVote(lobbyId, socket.id, targetId);
      io.to(lobbyId).emit("receive_game_state", gameManager.getGameState(lobbyId));
    });
  
    socket.on("damage_player", ({ lobbyId, targetId }) => {
      gameManager.applyDamage(lobbyId, targetId);
      io.to(lobbyId).emit("receive_game_state", gameManager.getGameState(lobbyId));
    });
  
    socket.on("next_round", ({ lobbyId }) => {
      gameManager.advanceRound(lobbyId);
      io.to(lobbyId).emit("receive_game_state", gameManager.getGameState(lobbyId));
    });

    socket.on("get_game_state", ({ lobbyId }) => {
      io.to(lobbyId).emit("receive_game_state", gameManager.getGameState(lobbyId));
    });

    socket.on("update_game_state", (data) => {
      io.to(data.room).emit("receive_game_state", data);
    });
  
    socket.on("update_player_data", (data) => {
      io.to(data.room).emit("receive_player_data", data);
    });

    socket.on("navigate", ({ lobbyId }) => {
      io.to(lobbyId).emit("navigate");
    });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
