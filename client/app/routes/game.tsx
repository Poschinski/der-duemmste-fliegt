import { use, useEffect, useState } from "react";
import { PlayerStats } from "~/components/playerStats";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";
import { Progress } from "~/components/ui/progress";
import { useLobby } from "~/context/LobbyContext";
import { useSocket } from "~/context/SocketContext";
import type { Game, Player, Question } from "~/models/game.model";

export default function Game() {
  const { lobby, userId, lobbyId } = useLobby();
  const [currentPlayerName, setCurrentPlayerName] = useState<string | null>();
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>();
  const [currentQuestion, setCurrentQuestion] = useState<string | null>();
  const [currentAnswer, setCurrentAnswer] = useState<string | null>();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [gameId, setGameId] = useState<string>("");
  const [isModerator, setIsModerator] = useState(false);
  const { socket } = useSocket();

  // const playerCount = lobby?.users? || 0;

  socket.on("currentTimer", ({ seconds }) => {
    setTimeLeft(seconds);
  });

  const handleNewQuestion = () => {
    socket.emit("loadQuestion", { lobbyId: lobbyId, lastUserId: currentPlayerId });

    socket.once("newQuestion", ({ user, userId, question }) => {
      setCurrentQuestion(question);
      setCurrentPlayerName(user);
      setCurrentPlayerId(userId);
    });
  }

  const endVoting = () => {
    socket.emit("endVoting", { lobbyId: lobbyId });
  };

  const castVote = (targetId: string) => {
    socket.emit("castVote", { lobbyId: lobbyId, voterId: userId, targetId });

    socket.on("votesUpdated", ({ totalVotes, voters }) => {
      console.log(`Votes: ${totalVotes}, Voters: ${voters.join(", ")}`);

    });
  };

  const startRound = () => {
    socket.emit("startRound", { lobbyId: lobbyId });
  };


  return (
    <div className="flex justify-center mt-32">
        <div className="flex flex-col gap-4 w-3xl justify-center">
          <div>
            {lobby?.users &&
              Object.entries(lobby.users)
              .filter(([_, player]) => player.role !== "moderator")
              .map(([uId, user]) => (
              <PlayerStats key={uId} name={user.name || ""} lives={user.lives || 0} you={user.id == userId} />
              ))}
          </div>
          <p className="text-2xl">Timer: {timeLeft}</p>
          <div>
            <Drawer>
              <DrawerTrigger asChild>
                <Button disabled={timeLeft > 0 && lobby?.phase == "voting"}>Öffne Voting</Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    <p>Wähle einen Spieler aus:</p>
                    {lobby?.users && Object.entries(lobby.users)
                    .filter(([_, player]) => player.role !== "moderator")
                    .map(([userId, user]) => (
                          <Button
                            key={userId}
                            onClick={() => {
                              castVote(user.id);
                            }}
                          >
                            {user.name}
                          </Button>
                        )
                      )}
                  </div>
                  <div>
                    <p>Ergebnisse:</p>
                    {lobby?.users &&
                      Object.entries(lobby.users)
                      .filter(([_, player]) => player.role !== "moderator")
                      .map(([userId, user]) => (
                        <div key={userId} className="flex flex-row gap-2">
                        <p>{user.name}</p>
                        <p>
                          {
                          Object.values(lobby.votes || {}).filter(
                            (vote) => vote === userId
                          ).length
                          }
                        </p>
                        <Progress
                          value={
                          (Object.values(lobby.votes || {}).filter(
                            (vote) => vote === userId
                          ).length /
                            Object.keys(lobby.users || {}).length) *
                          100
                          }
                        />
                        </div>
                      ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          {lobby?.moderatorId == userId ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2 my-4">
                <p>
                  <span className="font-bold">{currentPlayerName}</span>,{" "}
                  {currentQuestion}
                </p>
                <p>
                  <span className="font-bold">Antwort:</span>{" "}
                  {currentAnswer}
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <Button
                  disabled={timeLeft <= 0}
                  onClick={() => {
                    handleNewQuestion();
                  }}
                >
                  Nächse Frage
                </Button>
                <Button onClick={endVoting}>Beende Voting</Button>
                <Button onClick={startRound}>Starte Fragerunde</Button>
              </div>
            </div>
          ) : (
            <div>
              <p>Warte bis der Moderator dir eine Frage stellt.</p>
            </div>
          )}
        </div>
        <div>
          {lobby?.moderatorId == userId ? (
            <Button onClick={() => handleNewQuestion()}>
              Lade erste Frage
            </Button>
          ) : (
            <p>Warte bis der Moderator dir eine Frage stellt.</p>
          )}
        </div>
    </div>
  );
}
