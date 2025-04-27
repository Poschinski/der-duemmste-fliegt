import socket from "./socket";

const initSocketSession = (lobbyID: string, isModerator?: boolean, name?: string) => {
    console.log(lobbyID)
  const sessionID = sessionStorage.getItem("sessionID");
  if (sessionID) {
    socket.auth = { sessionID };
    socket.connect();
  } else {
    if (isModerator) {
      socket.auth = {
        username: name,
        isMod: true,
        lobbyID: lobbyID,
      };
    } else {
      socket.auth = { username: name, isMod: false, lobbyID: lobbyID };
    }
    socket.connect();
  }

  socket.on("session", ({ sessionID }) => {
    socket.auth = { sessionID };
    sessionStorage.setItem("sessionID", sessionID);
  });
};

export default initSocketSession;