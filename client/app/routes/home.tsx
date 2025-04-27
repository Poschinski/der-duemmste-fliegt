import { Button } from "~/components/ui/button";
import type { Route } from "./+types/home";
import { StartGame } from "~/startGame/startGame";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useNavigate } from "react-router";
import { use, useEffect, useState } from "react";
import socket from "~/socket";
import initSocketSession from "~/socketSession";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Der dümmste fliegt!" },
    {
      name: "very nice game",
      content: "Hier spielen wir das tolle Spiel 'Der dümmste fliegt'.",
    },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState<string>("");

  useEffect(() => {
    sessionStorage.clear();
    if (socket.connected) {
      socket.disconnect();
    }
  }, []);

  const startGame = () => {
    let tempGameId: number[] = [];
    for (let i = 0; i < 6; i++) {
      tempGameId.push(Math.floor(Math.random() * 10));
    }
    const newGameId = tempGameId.join("");

    initSocketSession(gameId, true, `Moderator-${Math.random().toString(36).substring(2, 8)}`);

    socket.emit("create_lobby", {lobbyId: newGameId});

    navigate(`/lobby/${newGameId}`, { state: { isModerator: true } });
  };

  return (
    <div className="flex justify-center mt-16">
      <div className="flex flex-col justify-center w-3xl">
        <h3 className="text-2xl">Wilkommen zu</h3>
        <h1 className="text-4xl bg-amber-300 mb-2">Der Dümmste fliegt!</h1>
        <p>
          Erstelle hier ein neues Spiel oder trete einem bestehenden Spiel über
          einen Einladungscode ein.
        </p>
        <p>Als Ersteller bist du automatisch </p>
        <div className="flex justify-center mt-4 gap-4 flex-col">
          <div>
            <Button className="w-full" onClick={() => startGame()}>
              Neues Spiel
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              id="game-input"
              placeholder="Code eingeben"
              onChange={(event) => setGameId(event.target.value)}
            />
            <Button
              onClick={() => navigate(`/joinGame/${gameId}`)}
              disabled={gameId.length !== 6}
            >
              Spiel beitreten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
