import { questions } from "data/questions";
import { useEffect, useState } from "react";
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
  const [round, setRound] = useState<number>(1);
  const [votingPhase, setVotingPhase] = useState<boolean>(false);

  const playerCount = settings?.players?.length || 0;

  const handleNextQuestion = () => {
    const playerIndex =
      settings?.players?.findIndex((p) => p.id === currentPlayer?.id) || 0;
    let nextPlayerIndex = playerIndex + 1;
    if (nextPlayerIndex >= playerCount) {
      nextPlayerIndex = 0;
    }
    const nextPlayer = settings?.players?.[nextPlayerIndex] || null;
    const nextQuestion =
      questions[Math.floor(Math.random() * questions.length)] || null;

    setCurrentPlayer(nextPlayer);
    setCurrentQuestion(nextQuestion);
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
  }, [timeLeft]);

  return (
    <div>
      {votingPhase ? (
        <div className="flex flex-col gap-4">
          {settings?.players &&
            settings.players.length > 0 &&
            settings.players.map((player: Player, index: number) => (
              <Button key={index}> {player.name}</Button>
            ))}
        </div>
      ) : (
        <div>
          <p>{timeLeft}</p>
          {currentPlayer && currentQuestion ? (
            <div>
              <p>
                {currentPlayer.name}, {currentQuestion.question}
              </p>
              <div>
                <p>Antwort: {currentQuestion.answer}</p>
              </div>
            </div>
          ) : (
            <div>
              <p>Kein Spieler oder keine Frage gefunden</p>
            </div>
          )}

          <div>
            <Button
            disabled={timeLeft <= 0}
              onClick={() => {
                const player = settings?.players?.find((p) => p.id === 1);
                handleNextQuestion();
              }}
            >
              Nächse Frage
            </Button>
            <Button disabled={timeLeft > 0} onClick={() => setVotingPhase(true)}>
                Nächste Runde
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
