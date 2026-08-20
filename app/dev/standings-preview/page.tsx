"use client";

import NbaLeagueStandingsPanel from "@/app/component/standings/NbaLeagueStandingsPanel";

/** Dev: カンファレンス順位表 */
export default function DevStandingsPreviewPage() {
  return (
    <main className="min-h-dvh bg-app px-4 pb-24 pt-4 text-white">
      <NbaLeagueStandingsPanel />
    </main>
  );
}
