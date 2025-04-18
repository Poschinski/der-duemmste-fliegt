import type { Route } from "./+types/home";
import { StartGame } from "~/startGame/startGame";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Der dümmste fliegt!" },
    { name: "very nice game", content: "Hier spielen wir das tolle Spiel 'Der dümmste fliegt'." },
  ];
}

export default function Home() {
  return (
    <div className="flex justify-center mt-16">
      <StartGame />

    </div>
  );
}
