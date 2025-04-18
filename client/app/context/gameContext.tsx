import { createContext, use, useContext, useEffect, useState} from "react";
import type { Game, Player } from "~/models/game.model";

interface GameContextType {
    settings: Game | null;
    setSettings: React.Dispatch<React.SetStateAction<Game | null>>;
}

export const GameContext = createContext<GameContextType>({settings: {roundTime: 180}, setSettings: () => {}});

export function GameProvider({children}: {children: React.ReactNode}) {
    const [settings, setSettings] = useState<Game | null>({roundTime: 180}); 
    useEffect(() => {
        console.log(settings);
    }
    , [settings])
    return (
        <GameContext.Provider value={{settings, setSettings}}>
            {children}
        </GameContext.Provider>
    )
}

export function useGame() {
    return useContext(GameContext);
}