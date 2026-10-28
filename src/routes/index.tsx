import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/game/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Que no se apague la ciudad · Juego de grafos" },
      { name: "description", content: "Juego educativo de teoría de grafos: llevá energía a las escuelas de una red eléctrica ficticia." },
      { property: "og:title", content: "Que no se apague la ciudad" },
      { property: "og:description", content: "Juego educativo de teoría de grafos sobre una red eléctrica ficticia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});
