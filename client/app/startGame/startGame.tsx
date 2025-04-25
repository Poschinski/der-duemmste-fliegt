import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { PlayerStats } from "~/components/playerStats";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Game, Player, Settings } from "~/models/game.model";
import socket from "~/socket";

export function StartGame() {
  const { state } = useLocation();
  const { moderatorId } = (state as { moderatorId: string }) || {};
  const [lobbyState, setLobbyState] = useState<Game>();
  const [settings, setSettings] = useState<Settings>({
    roundTime: 180,
    maxLives: 3,
  });
  const [gameId, setGameId] = useState("");
  const navigate = useNavigate();
  const [isModerator, setIsModerator] = useState(false);
  const params = useParams();

  useEffect(() => {
    let userId = socket.id;
    if (moderatorId === userId) {
      setIsModerator(true);
    }
    if (params.gameId) {
      setGameId(params.gameId);
    }
  }, []);

  useEffect(() => {
    if (!gameId) return;

    socket.emit("get_game_state", { lobbyId: gameId });

    const listener = (gameState: Game) => {
      console.log("Received game state:", gameState);
      setLobbyState(gameState);
    };

    socket.on("receive_game_state", listener);

    return () => {
      socket.off("receive_game_state", listener);
    };
  }, [gameId]);

  useEffect(() => {
    socket.on("receive_game_state", (gameState: Game) => {
      console.log("Received game state:", gameState);
      setLobbyState(gameState);
    });

    socket.on("navigate_to", () => {
      console.log("navigated To: /game/" + params.gameId )
      navigate(`/game/${params.gameId}` , {state: {moderatorId}});
    });
  },[socket, settings]);

  const handleSettingsChange = () => {
    socket.emit("change_lobby_settings", { lobbyId: gameId, settings });
  };

  const startGame = () => {
    socket.emit("navigate", { lobbyId: gameId });
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
            defaultValue={180}
            disabled={!isModerator}
            onChange={(e) => {
              setSettings({ ...settings, roundTime: Number(e.target.value) });
              handleSettingsChange();
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
              setSettings({ ...settings, maxLives: Number(e.target.value) });
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
      <div className="flex flex-col gap-2">
        {lobbyState?.players &&
          lobbyState.players.length > 0 &&
          lobbyState.players.map(
            (player: Player, index: number) =>
              !player.isMod && <PlayerStats key={index} {...player} />
          )}
      </div>
      <Button onClick={startGame} disabled={!isModerator}>
        Spiel starten
      </Button>
    </div>
  );
}
