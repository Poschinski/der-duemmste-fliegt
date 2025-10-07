import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { PlayerStats } from "~/components/playerStats";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useLobby } from "~/context/LobbyContext";
import { useSocket } from "~/context/SocketContext";

export function StartGame() {
  const { lobby, userId, lobbyId } = useLobby();
  const params = useParams();
  const { socket } = useSocket();

  useEffect(() => {
    console.log(lobby);
  }, [lobby]);

  const handleChange = (field: "maxLives" | "roundTime", value: number) => {
    socket.emit("changeSettings", {
      lobbyId: lobby?.id,
      settings: { [field]: value },
    });
  };

  const startGame = () => {
    socket.emit("startLobby", { lobbyId: lobby?.id });
  };

  return (
    <div className="flex flex-col gap-4 w-3xl justify-center">
      <h1 className="text-4xl bg-amber-300 mb-2">Der Dümmste fliegt!</h1>
      <Card>
        <CardHeader>
          <CardTitle>Einstellungen</CardTitle>
          <CardDescription>
            Lege hier die die Leben pro Spieler und die Zeit pro Runde fest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between gap-10">
            <div className="grow gap-1 flex flex-col">
              <Label htmlFor="roundTime">Zeit pro Runde</Label>
              <Input
                id="roundTime"
                type="number"
                placeholder="Zeit pro Runde"
                min={0}
                value={lobby?.settings?.roundTime || 180}
                disabled={lobby?.moderatorId !== userId}
                onChange={(e) =>
                  handleChange("roundTime", Number(e.target.value))
                }
              />
              <Label htmlFor="playerLives">Leben pro Spieler</Label>
              <Input
                id="playerLives"
                type="number"
                placeholder="Leben pro Spieler"
                min={0}
                value={lobby?.settings?.maxLives || 3}
                disabled={lobby?.moderatorId !== userId}
                onChange={(e) =>
                  handleChange("maxLives", Number(e.target.value))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Freunde einladen</CardTitle>
          <CardDescription>
            Sende den Lobbycode deinen Freunden damit sie beitreten können oder
            schicke ihnen direkt den Einladungslink.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="lobbyCode">Lobbycode</Label>
              <Input id="lobbyCode" value={params.gameId} readOnly />
              {/* <p>Lobbycode:</p>
              <p>{params.gameId}</p> */}
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(params.gameId || "");
                toast("In Zwischenablage kopiert!");
              }}
            >
              Einladungslink kopieren
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-2">
        <p>Spieler:</p>
      </div>
      {lobby?.users && Object.keys(lobby.users).length > 0 ? (
        <div className="flex flex-col gap-2">
          {lobby?.users && Object.entries(lobby.users)
            .filter(([_, player]) => player.role !== "moderator")
            .map(([userId, player]) => (
              <PlayerStats key={userId} name={player.name || ""} lives={player.lives || 0}/>
            ))}
        </div>
      ) : (
        <p>Es sind noch keine Spieler beigetreten.</p>
      )}
      <Button onClick={() => startGame()} disabled={lobby?.moderatorId !== userId}>
        Spiel starten
      </Button>
    </div>
  );
}
