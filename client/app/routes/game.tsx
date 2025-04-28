import { questions } from "data/questions";
import { use, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { PlayerStats } from "~/components/playerStats";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";
import { Progress } from "~/components/ui/progress";
import type { Game, Player, Question } from "~/models/game.model";
import socket from "~/socket";
import initSocketSession from "~/socketSession";

export default function Game() {
  // const { state } = useLocation();
  // const { moderatorId } = (state as { moderatorId: string }) || {};
  const [lobbyState, setLobbyState] = useState<Game>();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    questions[Math.floor(Math.random() * questions.length)] || null
  );
  const [timeLeft, setTimeLeft] = useState<number>(
    lobbyState?.settings.roundTime || 180
  );
  const [usedQuestions, setUsedQuestions] = useState<number[]>([]);
  const [gameId, setGameId] = useState<string>("");
  const [isModerator, setIsModerator] = useState(false);

  let params = useParams();
  useEffect(() => {
    if (!socket.connected) {
      initSocketSession(params.gameId || "000000")
    }
    socket.on("session", ({ isMod }) => {
      console.log("Is Mod", isMod);
      setIsModerator(isMod);
    });
    if (params.gameId) {
      setGameId(params.gameId);
    }
  }, []);

  useEffect(() => {
    if (!gameId) return;

    socket.emit("get_game_state", { lobbyID: gameId });

    const listener = (gameState: Game) => {
      console.log("Received game state:", gameState);
      setLobbyState(gameState);
    };

    socket.on("receive_game_state", listener);

    setCurrentPlayer(lobbyState?.players?.[0] || null);

    return () => {
      socket.off("receive_game_state", listener);
    };
  }, [gameId]);

  useEffect(() => {
    setCurrentPlayer(lobbyState?.players?.[0] || null);
    console.log("currentplayer", currentPlayer);
    console.log("lobbyState", lobbyState);
  }, [lobbyState]);

  useEffect(() => {
    socket.on("receive_game_state", (gameState: Game) => {
      console.log("Received game state:", gameState);
      setLobbyState(gameState);
    });
    
    socket.on("timer", (time: number) => {
      setTimeLeft(time);
    })
  }, [socket]);

  const playerCount = lobbyState?.players?.length || 0;

  const handleNextQuestion = () => {
    chooseNextPlayer();
    chooseNextQuestion();
  };

  const endVoting = () => {
    if (!lobbyState?.votes) return;
    const votes = lobbyState?.votes;
    const countMap: Record<string, number> = {};
    for (const playerId of Object.values(votes)) {
      countMap[playerId] = (countMap[playerId] || 0) + 1;
    }

    let mostFrequentPlayerId = null;
    let maxCount = 0;

    for (const [playerId, count] of Object.entries(countMap)) {
      if (count > maxCount) {
        mostFrequentPlayerId = playerId;
        maxCount = count;
      }
    }
    console.log("Most frequent player ID:", mostFrequentPlayerId);

    socket.emit("damage_player", { lobbyid: gameId, targetId: mostFrequentPlayerId });
  };

  const castVote = (targetId: string) => {
    socket.emit("cast_vote", { lobbyID: gameId, targetId });
  };

  const nextRound = () => {
    socket.emit("start_timer", { lobbyID: gameId, seconds: lobbyState?.settings.roundTime });
    socket.emit("next_round", { lobbyID: gameId });
  };

  const chooseNextPlayer = () => {
    const playerIndex =
      lobbyState?.players?.findIndex((p) => p.id === currentPlayer?.id) || 0;
    let nextPlayerIndex = playerIndex + 1;
    if (nextPlayerIndex >= playerCount) {
      nextPlayerIndex = 0;
    }
    let nextPlayer = lobbyState?.players?.[nextPlayerIndex] || null;
    while (nextPlayer && nextPlayer.lives === 0) {
      nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
      nextPlayer = lobbyState?.players?.[nextPlayerIndex] || null;
    }
    setCurrentPlayer(nextPlayer);
  };

  const chooseNextQuestion = () => {
    let nextQuestoinIndex = Math.floor(Math.random() * questions.length);
    while (usedQuestions.includes(nextQuestoinIndex)) {
      nextQuestoinIndex = Math.floor(Math.random() * questions.length);
    }
    setUsedQuestions([...usedQuestions, nextQuestoinIndex]);
    setCurrentQuestion(questions[nextQuestoinIndex] || null);
  };

  return (
    <div className="flex justify-center mt-32">
      {currentPlayer && currentQuestion ? (
        <div className="flex flex-col gap-4 w-3xl justify-center">
          <div>
            {lobbyState?.players &&
              lobbyState.players.length > 0 &&
              lobbyState.players.map((player: Player, index: number) => (
                <PlayerStats key={index} {...player} />
              ))}
          </div>
          <p className="text-2xl">Timer: {timeLeft}</p>
          <div>
            <Drawer>
              <DrawerTrigger asChild>
                <Button disabled={timeLeft > 0}>Öffne Voting</Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    <p>Wähle einen Spieler aus:</p>
                    {lobbyState?.players &&
                      lobbyState.players.length > 0 &&
                      lobbyState.players.map(
                        (player: Player, index: number) => !player.isMod && (
                          <Button
                            key={index}
                            onClick={() => {
                              castVote(player.id);
                            }}
                          >
                            {player.name}
                          </Button>
                        )
                      )}
                  </div>
                  <div>
                    <p>Ergebnisse:</p>
                    {lobbyState?.players &&
                      lobbyState.players.length > 0 &&
                      lobbyState.players.map(
                        (player: Player, index: number) => !player.isMod && (
                          <div key={index} className="flex flex-row gap-2">
                            <p>{player.name}</p>
                            <p>
                              {
                                Object.values(lobbyState.votes || {}).filter(
                                  (vote) => vote === player.id
                                ).length
                              }
                            </p>
                            <Progress
                              value={
                                (Object.values(lobbyState.votes || {}).filter(
                                  (vote) => vote === player.id
                                ).length /
                                  playerCount) *
                                100
                              }
                            />
                          </div>
                        )
                      )}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          {isModerator ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2 my-4">
                <p>
                  <span className="font-bold">{currentPlayer.name}</span>,{" "}
                  {currentQuestion.question}
                </p>
                <p>
                  <span className="font-bold">Antwort:</span>{" "}
                  {currentQuestion.answer}
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <Button
                  disabled={timeLeft <= 0}
                  onClick={() => {
                    handleNextQuestion();
                  }}
                >
                  Nächse Frage
                </Button>
                <Button onClick={endVoting}>Beende Voting</Button>
                <Button onClick={nextRound}>{lobbyState?.currentRound == 1 ? "Starte Runde" : "Nächste Runde"}</Button>
              </div>
            </div>
          ) : (
            <div>
              <p>Hallo Spieler</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p>Kein Spieler oder keine Frage gefunden</p>
        </div>
      )}
    </div>
  );
}
