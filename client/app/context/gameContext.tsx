import { createContext, use, useContext, useEffect, useState} from "react";
import type { Game, Player } from "~/models/game.model";

interface GameContextType {
    lobbyState: Game | null;
    setLobbyState: React.Dispatch<React.SetStateAction<Game | null>>;
}

export const GameContext = createContext<GameContextType>({lobbyState: {settings: { roundTime: 180, maxLives: 3}} , setLobbyState: () => {}});

export function GameProvider({children}: {children: React.ReactNode}) {
    const [lobbyState, setLobbyState] = useState<Game | null>({ settings:{ roundTime: 180, maxLives: 3}}); 
    return (
        <GameContext.Provider value={{lobbyState, setLobbyState}}>
            {children}
        </GameContext.Provider>
    )
}

export function useGame() {
    return useContext(GameContext);
}