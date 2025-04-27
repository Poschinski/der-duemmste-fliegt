import { useGame } from "~/context/gameContext";
import { Button } from "./ui/button";
import { X } from 'lucide-react';
import type { Player } from "~/models/game.model";

export function PlayerContainer(player: Player) {

  return (
    <div className="flex items-center rounded-md border bg-transparent px-3 py-1 w-full justify-between">
        <div>{player.name}</div>
        <Button variant="outline" size="icon">
            <X></X>
        </Button>
    </div>
  )  
} 