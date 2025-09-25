import express from "express";
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socketHandler.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  console.log(`Client verbunden: ${socket.id}`);
  registerSocketHandlers(io, socket);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});