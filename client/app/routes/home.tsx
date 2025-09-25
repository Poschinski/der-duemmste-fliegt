import { Button } from "~/components/ui/button";
import type { Route } from "./+types/home";
import { StartGame } from "~/startGame/startGame";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useNavigate } from "react-router";
import { use, useEffect, useState } from "react";
import socket from "~/socket";
import initSocketSession from "~/socketSession";
import Balatro from "~/components/Balatro";
import { useSocket } from "~/context/SocketContext";
import { toast } from "sonner";

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
  const { socket, connected } = useSocket();
  const [ gameId, setGameId ] = useState<string>("");
  const navigate = useNavigate();

  const handleCreateLobby = () => {
    if (!connected) {
      console.error("Socket not connected");
      toast.error("Verbindung zum Server fehlgeschlagen. Bitte versuche es später erneut.");
      return;
    }
    socket.emit("createLobby");

    socket.once("lobbyCreated", ({ lobbyId, userId }) => {
      sessionStorage.setItem("userId", userId);
      navigate(`/lobby/${lobbyId}`, { state: { isModerator: true } });
    });

  };

  return (
    <div className="flex justify-center mt-36">
      <div className="flex flex-col justify-center w-3xl gap-2">
        <h3 className="text-2xl">Wilkommen zu</h3>
        <h1 className="text-4xl bg-amber-300 mb-2">Der Dümmste fliegt!</h1>
        <div>
          <p>
            Erstelle hier ein neues Spiel oder trete einem bestehenden Spiel über
            einen Einladungscode ein.
          </p>
          <p>Als Ersteller bist du automatisch der Moderator des Spiels.</p>
        </div>
        <div className="flex justify-center mt-4 gap-4 flex-col">
          <div>
            <Button className="w-full cursor-pointer" onClick={() => handleCreateLobby()}>
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
              className="cursor-pointer"
            >
              Spiel beitreten
            </Button>
          </div>
        </div>
      </div>
      {/* <div className="absolute inset-0 -z-10">
        <Balatro isRotate={true} mouseInteraction={false} pixelFilter={700} spinRotation={0.6}/>
      </div> */}
    </div>
  );
}
