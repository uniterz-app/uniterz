"use client";

import { Suspense } from "react";
import RankGapPageShell from "@/app/component/rankings/gap/RankGapPageShell";

export default function WebRankGapPage() {
  return (
    <div className="min-h-screen bg-app px-4 py-8 md:px-8">
      <Suspense fallback={null}>
        <RankGapPageShell layout="web" />
      </Suspense>
    </div>
  );
}
