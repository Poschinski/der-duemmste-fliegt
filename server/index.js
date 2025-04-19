const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
  
    socket.on("join_lobby", (data) => {
      socket.join(data);
    });

    socket.on("game_state", (data) => {
      socket.to(data.room).emit("receive_game_state", data);
    });
  
    socket.on("update_player_data", (data) => {
      socket.to(data.room).emit("receive_player_data", data);
    });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
