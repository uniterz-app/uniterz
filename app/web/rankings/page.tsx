"use client";

import { Suspense } from "react";
import WebRankingsShell from "./_ui/WebRankingsShell";
import TutorialLiveHost from "@/app/component/tutorial/TutorialLiveHost";

export default function WebRankingsPage() {
  return (
    <Suspense fallback={null}>
      <WebRankingsShell />
      <TutorialLiveHost page="rankings" />
    </Suspense>
  );
}