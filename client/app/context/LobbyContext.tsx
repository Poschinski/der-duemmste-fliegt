import { type ReactNode, useState, useContext, createContext } from "react";
import type { Lobby, UserRole } from "~/models/lobby.model";

interface LobbyContextType {
  lobby: Lobby | null;
  userId: string | null;
  role: UserRole | null;
  setLobby: (lobby: Lobby, userId: string, role: UserRole) => void;
  updateLobby: (partial: Partial<Lobby>) => void;
  resetLobby: () => void;
}

const LobbyContext = createContext<LobbyContextType | null>(null);

export function LobbyProvider({ children }: { children: ReactNode }) {
  const [lobby, setLobbyState] = useState<Lobby | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  const setLobby = (lobby: Lobby, userId: string, role: UserRole) => {
    setLobbyState(lobby);
    setUserId(userId);
    setRole(role);
  };

  const updateLobby = (partial: Partial<Lobby>) => {
    setLobbyState((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const resetLobby = () => {
    setLobbyState(null);
    setUserId(null);
    setRole(null);
  };

  return (
    <LobbyContext.Provider
      value={{ lobby, userId, role, setLobby, updateLobby, resetLobby }}
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