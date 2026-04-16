"use client";

import { Suspense } from "react";
import WebRankingsShell from "./_ui/WebRankingsShell";

export default function WebRankingsPage() {
  return (
    <Suspense fallback={null}>
      <WebRankingsShell />
    </Suspense>
  );
}