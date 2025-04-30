import { DialogTitle } from "@radix-ui/react-dialog";
import { questions } from "data/questions";
import { use, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { PlayerStats } from "~/components/playerStats";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import type { Game, Player, Question, QuestionLog } from "~/models/game.model";
import socket from "~/socket";
import initSocketSession from "~/socketSession";

export default function Game() {
  const [lobbyState, setLobbyState] = useState<Game>();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [gameId, setGameId] = useState<string>("");
  const [isModerator, setIsModerator] = useState(false);
  const [votingOpen, setVotingOpen] = useState(false);
  const [playerAnswer, setPlayerAnswer] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  let params = useParams();
  useEffect(() => {
    if (!params.gameId) return;

    if (!socket.connected) {
      initSocketSession(params.gameId);
    }

    const onSession = ({ isMod }: { isMod: boolean }) => {
      console.log("Is Mod", isMod);
      setIsModerator(isMod);
    };

    const onGameState = (gameState: Game) => {
      console.log("Received game state:", gameState);
      setLobbyState(gameState);
    };

    const onTimer = (time: number) => {
      setTimeLeft(time);
    };

    socket.on("session", onSession);
    socket.on("receive_game_state", onGameState);
    socket.on("timer", onTimer);

    // Direkt nach Verbindung den GameState und die Session anfordern
    socket.emit("get_game_state", { lobbyID: params.gameId });
    socket.emit("get_session_data", { lobbyID: params.gameId });

    setGameId(params.gameId);

    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestion(questions[randomIndex]);
    setCurrentQuestionIndex(randomIndex);

    return () => {
      socket.off("session", onSession);
      socket.off("receive_game_state", onGameState);
      socket.off("timer", onTimer);
    };
  }, [params.gameId]);

  useEffect(() => {
    if (!lobbyState?.players || lobbyState.players.length === 0) {
      setCurrentPlayer(null);
      return;
    }

    setCurrentPlayer((prev) => {
      if (!lobbyState.players) return null;
      if (prev && lobbyState.players.find((p) => p.id === prev.id)) {
        return prev; // Falls der Spieler noch existiert
      }
      return lobbyState.players[0]; // Sonst auf ersten Spieler wechseln
    });

    if (lobbyState?.currentPhase === "voting") setVotingOpen(true);
    if (lobbyState?.currentPhase !== "voting") setVotingOpen(false);

    setTimeLeft(lobbyState?.settings.roundTime);
  }, [lobbyState]);

  const playerCount = lobbyState?.players?.length || 0;

  const handleNextQuestion = () => {
    setPlayerAnswer("");
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

    socket.emit("damage_player", {
      lobbyID: gameId,
      targetId: mostFrequentPlayerId,
    });
  };

  const castVote = (targetId: string) => {
    socket.emit("cast_vote", { lobbyID: gameId, targetId });
  };

  const nextRound = () => {
    chooseNextQuestion();
    chooseNextPlayer();
    socket.emit("start_timer", {
      lobbyID: gameId,
      seconds: lobbyState?.settings.roundTime,
    });
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
    socket.emit("log_question", {
      questionId: currentQuestionIndex,
      playerName: currentPlayer?.name,
      playerAnswer,
    });
    let nextQuestionIndex = Math.floor(Math.random() * questions.length);
    if (!lobbyState?.questionLog) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setCurrentQuestion(questions[nextQuestionIndex]);
      return;
    }
    while (
      lobbyState?.questionLog.some(
        (questions) => questions.questionId === nextQuestionIndex
      )
    ) {
      nextQuestionIndex = Math.floor(Math.random() * questions.length);
    }
    setCurrentQuestionIndex(nextQuestionIndex);
    setCurrentQuestion(questions[nextQuestionIndex]);
  };

  return (
    <div className="flex justify-center mt-32">
      {currentPlayer && currentQuestion ? (
        <div className="flex flex-col gap-4 w-3xl justify-center">
          <p className="text-2xl">Timer: {timeLeft}</p>
          <div className="grid grid-cols-2 gap-2">
            {lobbyState?.players &&
              lobbyState.players.length > 0 &&
              lobbyState.players.map((player: Player, index: number) => (
                <PlayerStats key={index} {...player} />
              ))}
          </div>
          <div>
            <Drawer open={votingOpen}>
              <DrawerTrigger asChild>
                <Button disabled={lobbyState?.currentPhase !== 'voting'}>Öffne Voting</Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-2/3 mb-10 max-h-1/2 overflow-y-auto">
                  <DrawerHeader>
                    <DrawerTitle>Voting</DrawerTitle>
                    <DrawerDescription>
                      Vote für den Spieler mit der dümmste Antwort.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="flex flex-col gap-5">
                    <div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {lobbyState?.players &&
                          lobbyState.players.length > 0 &&
                          lobbyState.players.map(
                            (player: Player, index: number) =>
                              !player.isMod &&
                              player.lives > 0 && (
                                <Button
                                  key={index}
                                  disabled={isModerator}
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
                        <p className="mb-2">Ergebnisse:</p>
                        {lobbyState?.players &&
                          lobbyState.players.length > 0 &&
                          lobbyState.players.map(
                            (player: Player, index: number) =>
                              !player.isMod &&
                              player.lives > 0 && (
                                <div
                                  key={index}
                                  className="grid grid-cols-2 gap-2"
                                >
                                  <p>{player.name}</p>
                                  <Progress
                                    className="mt-2"
                                    value={
                                      (Object.values(
                                        lobbyState.votes || {}
                                      ).filter((vote) => vote === player.id)
                                        .length /
                                        Object.values(lobbyState.votes || {})
                                          .length) *
                                      100
                                    }
                                  />
                                </div>
                              )
                          )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2">Antworten der letzen Runde:</p>
                      <div className="flex flex-col gap-2 h-36 overflow-y-auto">
                        {lobbyState?.questionLog &&
                          lobbyState.questionLog.length > 0 &&
                          lobbyState.questionLog.map(
                          (question: QuestionLog, index: number) => {
                            const questionData = questions[question.questionId];
                            if (!questionData) return null;
                            return (
                            <div key={index} className="flex flex-col gap-1 border-1">
                              <p>{questionData.question}</p>
                              <p>Korrekte Antwort: {questionData.answer}</p>
                              <p>Antwort von {question.playerName}: {question.playerAnswer}</p>
                            </div>
                            );
                          }
                          )}
                      </div>
                    </div>
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setVotingOpen(false);
                        }}
                      >
                        Schließen
                      </Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          {isModerator ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 my-4">
                <p className="text-lg">
                  <span className="font-bold">{currentPlayer.name}</span>,{" "}
                  {currentQuestion.question}
                </p>
                <p className="text-lg">
                  <span className="font-bold">Antwort:</span>{" "}
                  {currentQuestion.answer}
                </p>
                <Label htmlFor="playerAnswer">Antwort des Spielers</Label>
                <Input
                  id="playerAnswer"
                  type="text"
                  placeholder="Antwort des Spielers"
                  value={playerAnswer}
                  onChange={(e) => setPlayerAnswer(e.target.value)}
                />
              </div>
              <div className="flex justify-between gap-4">
                <Button
                  className="grow"
                  disabled={timeLeft <= 0}
                  onClick={() => {
                    handleNextQuestion();
                  }}
                >
                  Nächse Frage
                </Button>
                <Button className="grow" onClick={endVoting}>
                  Beende Voting
                </Button>
                <Button className="grow" onClick={nextRound}>
                  {lobbyState?.currentRound == 0
                    ? "Starte Runde"
                    : "Nächste Runde"}
                </Button>
              </div>
            </div>
          ) : (
            <div></div>
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
