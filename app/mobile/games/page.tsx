"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import TutorialLiveHost from "@/app/component/tutorial/TutorialLiveHost";

const GamesPage = dynamic(() => import("@/app/component/games/GamesPage"), {
  ssr: false,
});

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <GamesPage dense />
      </Suspense>
      <TutorialLiveHost page="games" />
    </>
  );
}
