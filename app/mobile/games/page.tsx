"use client";
import dynamic from "next/dynamic";
import TutorialLiveHost from "@/app/component/tutorial/TutorialLiveHost";

const GamesPage = dynamic(() => import("@/app/component/games/GamesPage"), {
  ssr: false,
});

export default function Page() {
  return (
    <>
      <GamesPage dense />
      <TutorialLiveHost page="games" />
    </>
  );
}
