"use client";
import dynamic from "next/dynamic";

const GamesPage = dynamic(() => import("@/app/component/games/GamesPage"), {
  ssr: false,
});

export default function Page() {
  return <GamesPage dense={false} />;
}
