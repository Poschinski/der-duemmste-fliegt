import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useLobby } from "~/context/LobbyContext";
import { useSocket } from "~/context/SocketContext";

export default function JoinGame() {
  const { socket } = useSocket();
  const { updateLobby } = useLobby();
  const [name, setName] = useState<string>("");
  const params = useParams();
  const navigate = useNavigate();

  const joinGame = () => {
    if (name.length < 3 || name.length > 30) {
      toast.warning("3 - 30 Zeichen du Esel!");
      return;
    }
    const lobbyId = params.gameId;

    console.log("Joining game", params.gameId, name);

    socket.emit("joinLobby", { lobbyId: params.gameId, name });

    socket.once("lobbyJoined", ({ data }) => {
      updateLobby(data);

      sessionStorage.setItem("userId", data.userId);
      navigate(`/lobby/${lobbyId}`);
    });
  }

  return (
    <div className="flex justify-center mt-16">
      <div className="flex flex-col justify-center w-3xl gap-1.5">
        <h1 className="text-4xl bg-amber-300 mb-2">Der Dümmste fliegt!</h1>
        <p>Lobby:</p> <p>{params.gameId}</p>
        <Label>Gib hier deinen Namen ein:</Label>
        <Input onChange={(e) => setName(e.target.value)} placeholder="Name" /> 
        <Button onClick={() => joinGame()} className="cursor-pointer">Spiel beitreten</Button>
      </div>
    </div>
  );
}