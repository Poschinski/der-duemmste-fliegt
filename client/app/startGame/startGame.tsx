import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { PlayerStats } from "~/components/playerStats";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Game, Player, Settings } from "~/models/game.model";
import socket from "~/socket";
import initSocketSession from "~/socketSession";

export function StartGame() {
  // const { state } = useLocation();
  // const { isModerator } = (state as { isModerator: boolean }) || {};
  const [ isModerator, setIsModerator ] = useState<boolean>(false);
  const [lobbyState, setLobbyState] = useState<Game>();
  const [settings, setSettings] = useState<Settings>({
    roundTime: 180,
    maxLives: 3,
  });
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (!socket.connected) {
      console.log("Socket not connected, initializing session...");
      initSocketSession(params.gameId || "000000")
    }
    socket.on("session", ({ isMod }) => {
      console.log("Is Mod", isMod);
      setIsModerator(isMod);
    });
    socket.on("receive_game_state", ( gameState ) => {
      console.log("Received game state:", gameState);
      setLobbyState(gameState);
    })
    return () => {
      socket.off("receive_game_state");
      socket.off("session");
    };
  } , []);

  useEffect(() => {
    if (!params.gameId) return;

    socket.emit("get_game_state", { lobbyId: params.gameId });

    const listener = (gameState: Game) => {
      console.log("Received game state:", gameState);
      setLobbyState(gameState);
    };

    socket.once("receive_game_state", listener);

  }, [params.gameId]);

  useEffect(() => {
    socket.on("receive_game_state", (gameState: Game) => {
      console.log("Received game state:", gameState);
      setLobbyState(gameState);
    });

    socket.on("navigate_to", () => {
      console.log("navigated To: /game/" + params.gameId )
      navigate(`/game/${params.gameId}`);
    });

    return () => {
      socket.off("receive_game_state");
      socket.off("navigate_to");
    };
  },[socket]);

  const startGame = () => {
    socket.emit("navigate", { lobbyId: params.gameId });
  };

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
            value={lobbyState?.settings.roundTime || 180}
            disabled={!isModerator}
            onChange={(e) => {
              const updatedSettings = { ...settings, roundTime: Number(e.target.value) };
              setSettings(updatedSettings);
              socket.emit("change_lobby_settings", { lobbyId: params.gameId, settings: updatedSettings });
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
              socket.emit("change_lobby_settings", { lobbyId: params.gameId, settings: updatedSettings });
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
      <div className="flex flex-col gap-2">
        {lobbyState?.players &&
          lobbyState.players.length > 0 &&
          lobbyState.players.map(
            (player: Player, index: number) =>
              <PlayerStats key={index} {...player} />
          )}
      </div>) : (
        <p>Es sind noch keine Spieler beigetreten.</p>
      )}
      <Button onClick={startGame} disabled={!isModerator}>
        Spiel starten
      </Button>
    </div>
  );
}
