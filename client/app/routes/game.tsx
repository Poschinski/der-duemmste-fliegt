import { questions } from "data/questions";
import { use, useEffect, useState } from "react";
import { useParams } from "react-router";
import { PlayerStats } from "~/components/playerStats";
import { Button } from "~/components/ui/button";
import { useGame } from "~/context/gameContext";
import type { Player, Question } from "~/models/game.model";

export default function Game() {
  const { settings, setSettings } = useGame();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(
    settings?.players?.[0] || null
  );
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    questions[Math.floor(Math.random() * questions.length)] || null
  );
  const [timeLeft, setTimeLeft] = useState<number>(settings?.roundTime || 180);
  const [votingPhase, setVotingPhase] = useState<boolean>(false);
  const [usedQuestions, setUsedQuestions] = useState<number[]>([]);
  const [gameId, setGameId] = useState<string>("000000");

  let params = useParams();
  useEffect(() => {
    if (params.gameId) {
      setGameId(params.gameId);
    }
  }, []);

  const playerCount = settings?.players?.length || 0;
  const isModerator = localStorage.getItem("isModerator") === "true";

  useEffect(() => {
    if (timeLeft <= 0) return;
    setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
  }, [timeLeft]);

  const handleNextQuestion = () => {
    chooseNextPlayer();
    chooseNextQuestion();
  };

  const handleVotingPhase = (player: Player) => {
    if (!settings) return;
    setSettings({
      ...settings,
      players: settings.players
        ? settings.players.map((p) =>
            p.id === player.id ? { ...p, lives: p.lives - 1 } : p
          )
        : [],
    });
    setVotingPhase(false);
    setTimeLeft(settings.roundTime || 180);
    chooseNextQuestion();
    chooseNextPlayer();
  };

  const chooseNextPlayer = () => {
    const playerIndex =
      settings?.players?.findIndex((p) => p.id === currentPlayer?.id) || 0;
    let nextPlayerIndex = playerIndex + 1;
    if (nextPlayerIndex >= playerCount) {
      nextPlayerIndex = 0;
    }
    let nextPlayer = settings?.players?.[nextPlayerIndex] || null;
    while (nextPlayer && nextPlayer.lives === 0) {
      nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
      nextPlayer = settings?.players?.[nextPlayerIndex] || null;
    }
    setCurrentPlayer(nextPlayer);
  };

  const chooseNextQuestion = () => {
    let nextQuestoinIndex = Math.floor(Math.random() * questions.length);
    while (usedQuestions.includes(nextQuestoinIndex)) {
      nextQuestoinIndex = Math.floor(Math.random() * questions.length);
    }
    setUsedQuestions([...usedQuestions, nextQuestoinIndex]);
    const nextQuestion = questions[nextQuestoinIndex] || null;
    setCurrentQuestion(nextQuestion);
  };

  return (
    <div className="flex justify-center mt-32">
      {currentPlayer && currentQuestion ? (
        <div className="flex flex-col gap-4 w-3xl justify-center">
          <div>
            {settings?.players &&
              settings.players.length > 0 &&
              settings.players.map((player: Player, index: number) => (
                <PlayerStats key={index} {...player} />
              ))}
          </div>
          <p>Timer: {timeLeft}</p>
          <div className="flex flex-col gap-2 my-4">
            <p>
              <span className="font-bold">{currentPlayer.name}</span>,{" "}
              {currentQuestion.question}
            </p>
          </div>
          {isModerator ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p>
                  <span className="font-bold">Antwort:</span>{" "}
                  {currentQuestion.answer}
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <Button
                  disabled={timeLeft <= 0}
                  onClick={() => {
                    const player = settings?.players?.find((p) => p.id === 1);
                    handleNextQuestion();
                  }}
                >
                  Nächse Frage
                </Button>
                <Button
                  disabled={timeLeft > 0}
                  onClick={() => setVotingPhase(true)}
                >
                  Nächste Runde
                </Button>
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
