import { type ReactNode, useState, useContext, createContext, useEffect } from "react";
import type { Settings } from "~/models/game.model";
import type { Lobby, LobbyUser, UserRole } from "~/models/lobby.model";
import { useSocket } from "./SocketContext";
import { useNavigate } from "react-router";

interface LobbyContextType {
  lobby: Lobby | null;
  userId: string | null;
  role: UserRole | null;
  lobbyId: string | null;
  setLobbyId: (lobbyId: string | null) => void;
  setLobby: (lobby: Lobby, userId: string, role: UserRole) => void;
  updateLobby: (partial: Partial<Lobby>) => void;
  resetLobby: () => void;
}

const LobbyContext = createContext<LobbyContextType | null>(null);

export function LobbyProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [lobby, setLobbyState] = useState<Lobby | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    socket.on("settingsUpdated", ({ settings }) => {
      setLobbyState((prev) => (prev ? { ...prev, settings } : prev));
    });

    socket.on("userListUpdated", ({ users }) => {
      setLobbyState((prev) => (prev ? { ...prev, users: Object.fromEntries(users.map((u: LobbyUser) => [u.id, u])) } : prev));
    });

    socket.on("navigateTo", ({ to }) => {
      console.log("Navigating to:", to);
      navigate(to);
    });

    socket.on("phaseChanged", ({ phase }) => {
      setLobbyState((prev) => (prev ? { ...prev, phase } : prev));
    });

    return () => {
      socket.off("settingsUpdated");
      socket.off("userListUpdated");
      socket.off("navigateTo");
      socket.off("phaseChanged");
    };
  }, [socket])

  const setLobby = (lobby: Lobby, userId: string, role: UserRole) => {
    setLobbyState(lobby);
    setUserId(userId);
    setRole(role);
  };

  const updateLobby = (partial: Partial<Lobby>) => {
    setLobbyState((prev) => {
      console.log("Previous lobby state:", prev);
      return prev ? { ...prev, ...partial } : prev;
    });
  };

  const resetLobby = () => {
    setLobbyState(null);
    setUserId(null);
    setRole(null);
  };

  return (
    <LobbyContext.Provider
      value={{ lobby, userId, role, lobbyId, setLobbyId, setLobby, updateLobby, resetLobby }}
    >
      {children}
    </LobbyContext.Provider>
  );
}

export function useLobby() {
  const context = useContext(LobbyContext);
  if (!context) {
    throw new Error("useLobby must be used within a LobbyProvider");
  }
  return context;
}