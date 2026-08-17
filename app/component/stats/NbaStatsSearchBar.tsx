"use client";

import { useMemo, useState } from "react";
import { nameOxanium } from "@/lib/fonts";
import {
  searchNbaStatsIndex,
  type NbaStatsSearchHit,
  type NbaStatsSearchKind,
} from "@/lib/nba/nbaStatsSearch";

type Props = {
  kind: NbaStatsSearchKind;
  language?: "ja" | "en";
  onSelect: (hit: NbaStatsSearchHit) => void;
};

export default function NbaStatsSearchBar({
  kind,
  language = "ja",
  onSelect,
}: Props) {
  const isJa = language === "ja";
  const [query, setQuery] = useState("");
  const hits = useMemo(
    () => searchNbaStatsIndex(query, kind, 8),
    [query, kind]
  );
  const placeholder =
    kind === "team"
      ? isJa
        ? "チームを検索（Lakers / LAL）"
        : "Search teams (Lakers / LAL)"
      : isJa
        ? "選手を検索（Luka / Curry）"
        : "Search players (Luka / Curry)";

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={[
          nameOxanium.className,
          "w-full border border-[rgba(0,245,255,0.28)] bg-black/50 px-3 py-2.5 text-[13px] font-semibold text-white placeholder:text-white/35 outline-none focus:border-[#00F5FF]",
        ].join(" ")}
      />
      {query.trim() ? (
        <div className="absolute left-0 right-0 z-20 mt-1 border border-[rgba(0,245,255,0.28)] bg-[#050808] shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
          {hits.length === 0 ? (
            <p
              className={`${nameOxanium.className} px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40`}
            >
              {isJa ? "該当なし" : "No matches"}
            </p>
          ) : (
            hits.map((hit) => (
              <button
                key={`${hit.kind}-${hit.id}`}
                type="button"
                onClick={() => {
                  onSelect(hit);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 border-b border-white/5 px-3 py-2.5 text-left last:border-b-0 hover:bg-white/[0.04]"
              >
                <span
                  className={`${nameOxanium.className} min-w-0 flex-1 truncate text-[13px] font-bold`}
                  style={{ transform: "skewX(-6deg)" }}
                >
                  {hit.name}
                </span>
                <span
                  className={`${nameOxanium.className} shrink-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#00F5FF]/80`}
                >
                  {hit.abbr}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
