"use client";

import { Suspense } from "react";
import RankGapPageShell from "@/app/component/rankings/gap/RankGapPageShell";

export default function MobileRankGapPage() {
  return (
    <div className="min-h-screen bg-app px-3 py-6">
      <Suspense fallback={null}>
        <RankGapPageShell layout="mobile" />
      </Suspense>
    </div>
  );
}
