import type { Player } from "~/models/game.model";


export function PlayerStats(player: Player) {

    return (
        <div className="flex border rounded-md p-2 justify-between">
            <div className="mr-2">{player.name}</div>
            {player.lives === 0 ? <div>💀</div> : (
                player.lives === 1 ? <div>❤️</div> : (
                    player.lives === 2 ? <div>❤️❤️</div> : (
                        player.lives === 3 ? <div>❤️❤️❤️</div> : <div>❤️❤️❤️❤️</div>
                    )
                )
            )}
        </div>
    )
}