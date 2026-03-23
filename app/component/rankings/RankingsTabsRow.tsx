"use client";

import { jp } from "@/lib/fonts";

function LeagueTabBtn({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <button
      type="button"
      disabled
      className={[
        "rounded-xl border px-4 py-2 text-sm backdrop-blur-md transition-colors",
        active
          ? "border-cyan-200/25 bg-white/10 font-extrabold text-white shadow-[0_0_18px_rgba(0,255,255,0.10)]"
          : "border-white/10 bg-white/5 text-white/70",
        "cursor-default",
        jp.className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function RankingsTabsRow() {
  return (
    <div className="flex items-center justify-start">
      <div className="flex gap-2">
        <LeagueTabBtn label="NBA" active />
      </div>
    </div>
  );
}