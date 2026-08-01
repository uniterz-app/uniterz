"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  NBA_SEASON_AWARD_DEFS,
  awardCandidateLabel,
  filterAwardCandidatesByPrefix,
  popularAwardPicks,
  type NbaAwardCandidate,
  type NbaAwardId,
  type NbaSeasonAwardsPrediction,
  SEASON_AWARDS_SCORE_PREVIEW,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import {
  awardsPreviewCatalog,
  AWARDS_PREVIEW_POPULAR,
} from "@/lib/predict/nbaSeasonAwardsPreviewMocks";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  value: NbaSeasonAwardsPrediction;
  onChange?: (next: NbaSeasonAwardsPrediction) => void;
  className?: string;
};

function findInCatalog(
  id: string | null | undefined,
  catalog: readonly NbaAwardCandidate[]
): NbaAwardCandidate | null {
  if (!id) return null;
  return catalog.find((c) => c.id === id) ?? null;
}

function AwardPickRow({
  awardId,
  labelEn,
  labelJa,
  kind,
  selectedId,
  onSelect,
}: {
  awardId: NbaAwardId;
  labelEn: string;
  labelJa: string;
  kind: "player" | "coach";
  selectedId: string | null | undefined;
  onSelect: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const catalog = awardsPreviewCatalog(kind);
  const selected = findInCatalog(selectedId, catalog);

  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return popularAwardPicks(AWARDS_PREVIEW_POPULAR[awardId], catalog);
    }
    return filterAwardCandidatesByPrefix(catalog, trimmed);
  }, [awardId, catalog, query]);

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
        <span className="text-[11px] text-white/40">{labelJa}</span>
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
              "shrink-0 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 hover:text-white/70",
            ].join(" ")}
            onClick={() => {
              onSelect(null);
              setQuery("");
              setOpen(false);
            }}
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            placeholder={kind === "coach" ? "Coach name…" : "Player name…"}
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
                  : "Popular picks · top 5"}
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

/** アワード予想（プレビュー: 人気5 + 前方一致。名簿は mock） */
export default function NbaSeasonAwardsPredictPanel({
  value,
  onChange,
  className,
}: Props) {
  const pathname = usePathname() ?? "";
  const isNarrow =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");

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
          フォーカス直後は他ユーザー人気ピック約 5 人。入力すると N → NI → NIK
          の前方一致。選手名簿は API 契約後に差し替え。採点は未定（仮 +
          {SEASON_AWARDS_SCORE_PREVIEW.exact}pt）。
        </p>
      </header>

      <ul
        className={
          isNarrow
            ? "space-y-2.5"
            : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        }
      >
        {NBA_SEASON_AWARD_DEFS.map((def) => (
          <AwardPickRow
            key={def.id}
            awardId={def.id}
            labelEn={def.labelEn}
            labelJa={def.labelJa}
            kind={def.kind}
            selectedId={value.picks[def.id]}
            onSelect={(id) => {
              onChange?.({
                ...value,
                picks: { ...value.picks, [def.id]: id },
              });
            }}
          />
        ))}
      </ul>
    </div>
  );
}
