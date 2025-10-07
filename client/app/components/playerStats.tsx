import type { Player } from "~/models/game.model";
import type { LobbyUser } from "~/models/lobby.model";


interface PlayerStatsProps {
    name: string;
    lives: number;
    you?: boolean;
}

export function PlayerStats({ name, lives, you }: PlayerStatsProps) {
    return (
        <div className="flex border rounded-md p-2">
            <div>{you ? `${name} (Du)` : name}:</div>
            <div>{"❤️".repeat(lives) || "💀"}</div>
        </div>
    );
}