import { createContext, useContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import socket from "~/socket";

interface SocketContextType {
  socket: typeof socket;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({children}: {children: React.ReactNode}) => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("error", ({ message }) => {
      console.error("[Socket Error]", message);
      toast.error(message ?? "Unbekannter Fehler");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}