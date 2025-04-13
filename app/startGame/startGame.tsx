import { Label } from "@radix-ui/react-label";
import { useState } from "react";
import { useNavigate } from "react-router";
import { PlayerContainer } from "~/components/playerContainer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useGame } from "~/context/gameContext";
import type { Player } from "~/models/game.model";

export function StartGame() {
  const { settings, setSettings } = useGame();
  const navigate = useNavigate();

  const startGame = () => {
    navigate("/game");
  };

  const handleAddPlayer = (name: string) => {
    setSettings({
        ...settings,
        players: [
          ...(settings?.players || []),
          {
            id: settings?.players ? settings.players.length + 1 : 1,
            name: name,
            lives: 3,
          },
        ],
      });
  }

  return (
    <div className="flex flex-col gap-4 w-3xl justify-center">
      <h3>Wilkommen zu</h3>
      <h1>Der dümmste fliegt!</h1>
      <p>
        Gib hier die Namen der Mitspieler ein und lege die Anzahl der Runden,
        die Leben pro Spieler sowie die Zeit pro Runde fest.
      </p>
      <div className="flex flex-row justify-between gap-10">
        <div className="grow">
          <Label htmlFor="roundTime">Zeit pro Runde (Sekunden)</Label>
          <Input
            id="roundTime"
            type="number"
            placeholder="Zeit pro Runde"
            min={0}
            defaultValue={180}
            onChange={(e) => {
              setSettings({...settings, roundTime: Number(e.target.value) });
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="playerInput">Spielernamen</Label>
        <Input
          id="playerInput"
          placeholder={`Spieler ${
            settings?.players ? settings.players.length + 1 : 1
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddPlayer(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
        {settings?.players && settings.players.length > 0 && (
          settings.players.map((player: Player, index: number) => (
            <PlayerContainer key={index} {...player} />
          ))
        )}
        
      </div>
      <Button onClick={startGame}>Spiel starten</Button>
    </div>
  );
}
