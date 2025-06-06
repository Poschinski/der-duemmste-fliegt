import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import socket from "~/socket";
import initSocketSession from "~/socketSession";

export default function JoinGame() {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState<string>("000000");
  const [name, setName] = useState<string>("");
  const params = useParams();

  useEffect(() => {
    if (params.gameId) {
      setGameId(params.gameId);
    }
  }, []);

  const joinGame = () => {
    if (name.length < 3 || name.length > 30) {
      alert("3 - 30 Zeichen du Eumel!");
      return;
    }

    console.log("Verbinde mit Socket... params" +  `${params.gameId || ""}, false, ${name}`);
    console.log("Verbinde mit Socket... gameId state" +  `${gameId}, false, ${name}`);
    initSocketSession(params.gameId || "", false, name);

    socket.emit("join_lobby", { lobbyID: gameId });
    navigate(`/lobby/${gameId}`);
  };

  return (
    <div className="flex justify-center mt-16">
      <div className="flex flex-col justify-center w-3xl gap-1.5">
        <h1 className="text-4xl bg-amber-300 mb-2">Der Dümmste fliegt!</h1>
        <p>Lobby:</p> <p>{gameId}</p>
        <Label>Gib hier deinen Namen ein:</Label>
        <Input onChange={(e) => setName(e.target.value)} placeholder="Name" /> 
        <Button onClick={() => joinGame()}>Spiel beitreten</Button>
      </div>
    </div>
  );
}