import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PlayerStats } from "~/components/playerStats";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Game, Settings } from "~/models/game.model";
import type { Player } from "~/models/player.model";
import socket from "~/socket";
import initSocketSession from "~/socketSession";

export function StartGame() {
  const [ isModerator, setIsModerator ] = useState<boolean>(false);
  const [lobbyState, setLobbyState] = useState<Game>();
  const [settings, setSettings] = useState<Settings>({
    roundTime: 180,
    maxLives: 3,
  });
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (!params.gameId) {
      console.error("Kein GameID Parameter vorhanden!");
      return;
    }

    if (!socket.connected) {
      initSocketSession(params.gameId);
    }

    const onSession = ({ isMod }: { isMod: boolean }) => {
      setIsModerator(isMod);
    };

    const onGameState = (gameState: Game) => {
      console.log("Spielstatus empfangen:", gameState);
      setLobbyState(gameState);
    };

    const onNavigateTo = () => {
      console.log("Navigiere zu: /game/" + params.gameId);
      navigate(`/game/${params.gameId}`);
    };

    socket.on("session", onSession);
    socket.on("receive_game_state", onGameState);
    socket.on("navigate_to", onNavigateTo);

    socket.emit("get_game_state");

    return () => {
      socket.off("session", onSession);
      socket.off("receive_game_state", onGameState);
      socket.off("navigate_to", onNavigateTo);
    };
  }, [params.gameId, navigate]);

  const startGame = () => {
    console.log("sende navigate an socket")
    socket.emit("navigate");
  };

  return (
    <div className="flex flex-col gap-4 w-3xl justify-center">
      <h1 className="text-4xl bg-amber-300 mb-2">Der Dümmste fliegt!</h1>
      <p>
        Lege hier die Leben pro Spieler und die Zeit pro Runde fest.
      </p>
      <div className="flex flex-row justify-between gap-10">
        <div className="grow gap-1 flex flex-col">
          <Label htmlFor="roundTime">Zeit pro Runde</Label>
          <Input
            id="roundTime"
            type="number"
            placeholder="Zeit pro Runde"
            min={0}
            value={lobbyState?.settings.roundTime || 180}
            disabled={!isModerator}
            onChange={(e) => {
              const updatedSettings = { ...settings, roundTime: Number(e.target.value) };
              setSettings(updatedSettings);
              socket.emit("change_lobby_settings", { lobbyID: params.gameId, settings: updatedSettings });
            }}
          />
          <Label htmlFor="playerLives">Leben pro Spieler</Label>
          <Input
            id="playerLives"
            type="number"
            placeholder="Leben pro Spieler"
            min={0}
            value={lobbyState?.settings.maxLives || 3}
            disabled={!isModerator}
            onChange={(e) => {
              const updatedSettings = { ...settings, maxLives: Number(e.target.value) };
              setSettings(updatedSettings);
              socket.emit("change_lobby_settings", { lobbyID: params.gameId, settings: updatedSettings });
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
            <p>{params.gameId}</p>
          </div>
          <Button>Einladungslink kopieren</Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p>Spieler:</p>
      </div>
      {lobbyState?.players && lobbyState.players.length > 0 ? (
      <div className="grid grid-cols-2 gap-2">
        {lobbyState?.players &&
          lobbyState.players.length > 0 &&
          lobbyState.players.map(
            (player: Player, index: number) =>
              <PlayerStats key={index} {...player} />
          )}
      </div>) : (
        <p>Es sind noch keine Spieler beigetreten.</p>
      )}
      <Button onClick={() => startGame()} disabled={!isModerator}>
        Spiel starten
      </Button>
    </div>
  );
}
