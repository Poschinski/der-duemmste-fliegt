import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { PlayerContainer } from "~/components/playerContainer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useGame } from "~/context/gameContext";
import type { Player } from "~/models/game.model";
import socket from "~/socket";

export function StartGame() {
  const {state} = useLocation();
  const { moderatorId } = state as { moderatorId: string } || {};
  const { settings, setSettings } = useGame();
  const [gameId, setGameId] = useState("");
  const navigate = useNavigate();
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    let userId = socket.id;

    if (moderatorId === userId) {
      setIsModerator(true);
    }

  }, []);

  let params = useParams();
  useEffect(() => {
    if (params.gameId) {
      setGameId(params.gameId);
    }
  }, []);

  const startGame = () => {
    navigate(`/game/${gameId}`);
  };

  // const handleAddPlayer = (name: string) => {
  //   setSettings({
  //     ...settings,
  //     players: [
  //       ...(settings?.players || []),
  //       {
  //         id: settings?.players ? settings.players.length + 1 : 1,
  //         name: name,
  //         lives: 3,
  //       },
  //     ],
  //   });
  // };

  return (
    <div className="flex flex-col gap-4 w-3xl justify-center">
      <h1 className="text-4xl bg-amber-300 mb-2">Der Dümmste fliegt!</h1>
      <p>
        Gib hier die Namen der Mitspieler ein und lege die die Leben pro Spieler
        und die Zeit pro Runde fest.
      </p>
      <div className="flex flex-row justify-between gap-10">
        <div className="grow gap-1 flex flex-col">
          <Label htmlFor="roundTime">Zeit pro Runde</Label>
          <Input
            id="roundTime"
            type="number"
            placeholder="Zeit pro Runde"
            min={0}
            defaultValue={180}
            disabled={!isModerator}
            onChange={(e) => {
              setSettings({ ...settings, roundTime: Number(e.target.value) });
            }}
          />
          <Label htmlFor="playerLives">Leben pro Spieler</Label>
          <Input
            id="playerLives"
            type="number"
            placeholder="Leben pro Spieler"
            min={0}
            defaultValue={3}
            disabled={!isModerator}
            onChange={(e) => {
              console.log(e.target.value);
            }}
          />
        </div>
      </div>
      <div>
        <p>
          Schicke den Lobbycode deinen Freunden damit sie beitreten können oder
          schicke ihnen direkt einen Einladungslink.
        </p>
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <p>Lobbycode:</p>
            <p>{gameId}</p>
          </div>
          <Button>Einladungslink kopieren</Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p>Spieler:</p>
      </div>
      {/* <div className="flex flex-col gap-2">
        <Label htmlFor="playerInput">Spielernamen (Enter zum hinzufügen)</Label>
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
        
      </div> */}
      <Button onClick={startGame} disabled={!isModerator}>Spiel starten</Button>
    </div>
  );
}
