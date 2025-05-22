import socket from "./socket";

const initSocketSession = (lobbyID: string, isModerator?: boolean, name?: string) => {
  if (socket.connected) socket.disconnect();

  const sessionID = sessionStorage.getItem("sessionID");
  if (sessionID) {
    socket.auth = { sessionID };
  } else {
    socket.auth = {
      username: name,
      isMod: !!isModerator,
      lobbyID: lobbyID,
    };
  }

  socket.connect();

  socket.on("session", ({ sessionID }) => {
    socket.auth = { sessionID };
    sessionStorage.setItem("sessionID", sessionID);
  });

  socket.on("connect_error", (err) => {
    if (err?.message === "Session ID unknown") {
      sessionStorage.removeItem("sessionID");
      window.location.reload();
    }
  });
};

export default initSocketSession;