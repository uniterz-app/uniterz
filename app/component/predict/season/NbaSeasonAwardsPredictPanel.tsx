"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  NBA_SEASON_AWARD_DEFS,
  awardCandidateLabel,
  filterAwardCandidatesByPrefix,
  filledSeasonAwardsCount,
  isSeasonAwardsComplete,
  popularAwardPicks,
  type NbaAwardCandidate,
  type NbaAwardId,
  type NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import { AWARDS_PREVIEW_COACHES } from "@/lib/predict/nbaSeasonAwardsPreviewMocks";
import { SEASON_AWARDS_CURATED_POPULAR } from "@/lib/predict/seasonAwardsCuratedPopular";
import { seasonAwardsCatalogForAward } from "@/lib/predict/seasonAwardsCatalogFromRosters";
import { useSeasonAwardsPlayerCatalog } from "@/lib/predict/useSeasonAwardsPlayerCatalog";
import { nameOxanium } from "@/lib/fonts";
import type { UiStrings } from "@/lib/i18n/ui";
import { awardName } from "@/lib/predict/nbaSeasonAwardsPredict";
import {
  seasonPredictAwardsPredictHint,
  seasonPredictPageUiCopy,
  type SeasonPredictUiLang,
} from "@/lib/predict/seasonPredictUiCopy";

type Props = {
  value: NbaSeasonAwardsPrediction;
  onChange?: (next: NbaSeasonAwardsPrediction) => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  className?: string;
  language?: SeasonPredictUiLang;
};

function AwardPickRow({
  awardId,
  labelEn,
  name,
  kind,
  selected,
  selectedId,
  onSelect,
  language,
  catalog,
}: {
  awardId: NbaAwardId;
  labelEn: string;
  name: UiStrings;
  kind: "player" | "coach";
  selected: NbaAwardCandidate | null;
  selectedId: string | null | undefined;
  onSelect: (id: string | null) => void;
  language: SeasonPredictUiLang;
  catalog: readonly NbaAwardCandidate[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const placeholder =
    awardId === "roy"
      ? "Rookie name…"
      : kind === "coach"
        ? "Coach name…"
        : "Player name…";

  const suggestions = useMemo(() => {
    if (selectedId) return [];
    const trimmed = query.trim();
    if (!trimmed) {
      // COTY: HC は知名度差が大きいので全30人を出す
      if (awardId === "coty") return [...catalog];
      return popularAwardPicks(
        SEASON_AWARDS_CURATED_POPULAR[awardId],
        catalog
      );
    }
    return filterAwardCandidatesByPrefix(catalog, trimmed);
  }, [awardId, catalog, query, selectedId]);

  return (
    <li className="border border-white/12 bg-white/[0.02] px-3 py-2.5">
      <div className="mb-2 flex items-baseline gap-2">
        <span
          className={[
            nameOxanium.className,
            "text-[11px] font-extrabold uppercase tracking-[0.12em] text-amber-200/85",
          ].join(" ")}
        >
          {labelEn}
        </span>
        <span className="text-[11px] text-white/40">
          {awardName(language, { name })}
        </span>
      </div>

      {selected ? (
        <div className="flex items-center justify-between gap-2 border border-amber-300/25 bg-amber-300/[0.06] px-2.5 py-2">
          <div className="min-w-0">
            <p
              className={[
                nameOxanium.className,
                "truncate text-[12px] font-extrabold uppercase tracking-[0.04em] text-white",
              ].join(" ")}
            >
              {awardCandidateLabel(selected)}
            </p>
            {selected.teamAbbr ? (
              <p className="text-[9px] font-bold text-white/35">
                {selected.teamAbbr}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={[
              nameOxanium.className,
              "shrink-0 touch-manipulation px-2.5 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 hover:text-white/70 active:text-white/90",
            ].join(" ")}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(null);
              setQuery("");
              setOpen(false);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(null);
              setQuery("");
              setOpen(false);
            }}
          >
            Clear
          </button>
        </div>
      ) : awardId === "coty" ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={[
              nameOxanium.className,
              "w-full border border-white/15 bg-[rgba(4,10,16,0.9)] px-2.5 py-2.5 text-left text-base font-bold tracking-wide text-white/25 outline-none",
            ].join(" ")}
          >
            {open ? "Tap to close list…" : "Select head coach…"}
          </button>
          {open ? (
            <div className="relative z-10 mt-1 max-h-80 w-full overflow-y-auto border border-white/12 bg-[rgba(6,10,16,0.98)] shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
              <p
                className={[
                  nameOxanium.className,
                  "border-b border-white/8 px-2.5 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.14em] text-white/35",
                ].join(" ")}
              >
                All head coaches · 30
              </p>
              <ul>
                {suggestions.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-amber-300/10"
                      onClick={() => {
                        onSelect(c.id);
                        setOpen(false);
                      }}
                    >
                      <span
                        className={[
                          nameOxanium.className,
                          "text-[12px] font-bold uppercase tracking-[0.03em] text-white/90",
                        ].join(" ")}
                      >
                        {awardCandidateLabel(c)}
                      </span>
                      {c.teamAbbr ? (
                        <span className="text-[9px] font-bold text-white/30">
                          {c.teamAbbr}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 120);
            }}
            className={[
              nameOxanium.className,
              "w-full border border-white/15 bg-[rgba(4,10,16,0.9)] px-2.5 py-2.5 text-base font-bold tracking-wide text-white outline-none placeholder:text-white/25 focus:border-amber-300/40",
            ].join(" ")}
          />
          {open ? (
            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-white/12 bg-[rgba(6,10,16,0.98)] shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
              <p
                className={[
                  nameOxanium.className,
                  "border-b border-white/8 px-2.5 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.14em] text-white/35",
                ].join(" ")}
              >
                {query.trim()
                  ? `Suggestions · “${query.trim()}”`
                  : "Featured · top 5"}
              </p>
              {suggestions.length === 0 ? (
                <p className="px-2.5 py-3 text-[11px] text-white/35">
                  No matches
                </p>
              ) : (
                <ul>
                  {suggestions.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-amber-300/10"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onSelect(c.id);
                          setQuery("");
                          setOpen(false);
                        }}
                      >
                        <span
                          className={[
                            nameOxanium.className,
                            "text-[12px] font-bold uppercase tracking-[0.03em] text-white/90",
                          ].join(" ")}
                        >
                          {awardCandidateLabel(c)}
                        </span>
                        {c.teamAbbr ? (
                          <span className="text-[9px] font-bold text-white/30">
                            {c.teamAbbr}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}
    </li>
  );
}

/** アワード予想（運営指定の候補5 + ロスター全選手検索） */
export default function NbaSeasonAwardsPredictPanel({
  value,
  onChange,
  onSubmit,
  submitDisabled,
  className,
  language = "ja",
}: Props) {
  const pathname = usePathname() ?? "";
  const isNarrow =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const filled = filledSeasonAwardsCount(value.picks);
  const total = NBA_SEASON_AWARD_DEFS.length;
  const allDone = isSeasonAwardsComplete(value);
  const { players, loading } = useSeasonAwardsPlayerCatalog({
    season: value.season,
  });
  const catalogsByAward = useMemo(() => {
    const out = {} as Record<NbaAwardId, readonly NbaAwardCandidate[]>;
    for (const def of NBA_SEASON_AWARD_DEFS) {
      out[def.id] = seasonAwardsCatalogForAward(
        def.id,
        players,
        value.season,
        AWARDS_PREVIEW_COACHES
      );
    }
    return out;
  }, [players, value.season]);
  const candidateById = useMemo(() => {
    const m = new Map<string, NbaAwardCandidate>();
    for (const list of Object.values(catalogsByAward)) {
      for (const c of list) m.set(c.id, c);
    }
    return m;
  }, [catalogsByAward]);

  return (
    <div
      className={[
        "rounded-[2px] border border-amber-300/25 bg-[rgba(6,10,16,0.96)] p-3 md:p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="mb-3 space-y-1">
        <h2
          className={[
            nameOxanium.className,
            "text-[13px] font-extrabold uppercase tracking-[0.14em] text-amber-200/90 md:text-[15px]",
          ].join(" ")}
        >
          Season awards · {value.season}
        </h2>
        <p className="text-[11px] leading-relaxed text-white/45 md:max-w-3xl md:text-sm">
          {seasonPredictAwardsPredictHint(language)}
        </p>
        {loading ? (
          <p
            className={[
              nameOxanium.className,
              "text-[9px] font-bold uppercase tracking-[0.12em] text-white/30",
            ].join(" ")}
          >
            Loading roster…
          </p>
        ) : null}
      </header>

      <ul
        className={
          isNarrow
            ? "space-y-2.5"
            : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        }
      >
        {NBA_SEASON_AWARD_DEFS.map((def) => {
          const selectedId = value.picks[def.id];
          return (
          <AwardPickRow
            key={def.id}
            awardId={def.id}
            labelEn={def.labelEn}
            name={def.name}
            kind={def.kind}
            catalog={catalogsByAward[def.id] ?? []}
            selected={
              typeof selectedId === "string" && selectedId
                ? candidateById.get(selectedId) ?? null
                : null
            }
            selectedId={selectedId}
            language={language}
            onSelect={(id) => {
              onChange?.({
                ...value,
                picks: { ...value.picks, [def.id]: id },
              });
            }}
          />
          );
        })}
      </ul>

      {onSubmit ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-white/8 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.12em]",
              allDone ? "text-[#2DFF6E]/85" : "text-white/40",
            ].join(" ")}
          >
            {allDone
              ? "Ready to submit · all awards picked"
              : `Progress · ${filled}/${total}`}
          </p>
          <button
            type="button"
            disabled={submitDisabled}
            onClick={onSubmit}
            className={[
              nameOxanium.className,
              "px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] transition",
              allDone && !submitDisabled
                ? "border border-amber-300/50 bg-amber-300/20 text-amber-50 hover:bg-amber-300/28"
                : submitDisabled
                  ? "cursor-wait border border-white/10 bg-white/[0.04] text-white/30"
                  : "border border-white/15 bg-white/[0.04] text-white/55 hover:bg-white/[0.08]",
            ].join(" ")}
          >
            {submitDisabled ? seasonPredictPageUiCopy(language ?? "ja").submitting : seasonPredictPageUiCopy(language ?? "ja").submitPrediction}
          </button>
        </div>
      ) : null}
    </div>
  );
}
