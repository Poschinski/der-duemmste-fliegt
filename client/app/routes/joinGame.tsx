import { useState, useEffect, use } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useLobby } from "~/context/LobbyContext";
import { useSocket } from "~/context/SocketContext";

export default function JoinGame() {
  const { socket } = useSocket();
  const { lobby, setLobby } = useLobby();
  const [name, setName] = useState<string>("");
  const navigate = useNavigate();
  const params = useParams();

  const joinGame = () => {
    if (name.length < 3 || name.length > 30) {
      toast.warning("3 - 30 Zeichen du Esel!");
      return;
    }

    socket.emit("joinLobby", { lobbyId: params.gameId, name});

    socket.once("lobbyJoined", ({ lobby, userId }) => {

      setLobby(lobby, userId, lobby.users[userId].role);
      sessionStorage.setItem("userId", userId);
      navigate(`/lobby/${lobby?.id}`);
    });
  }

  return (
    <div className="flex justify-center mt-16">
      <div className="flex flex-col justify-center w-3xl gap-1.5">
        <h1 className="text-4xl bg-amber-300 mb-2">Der Dümmste fliegt!</h1>
        <div className="flex gap-1">
        <p>Lobby:</p> <p>{params.gameId}</p>
        </div>
        <Label>Gib hier deinen Namen ein:</Label>
        <Input onChange={(e) => setName(e.target.value)} placeholder="Name" /> 
        <Button onClick={() => joinGame()} className="cursor-pointer">Spiel beitreten</Button>
      </div>
    </div>
  );
}