"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import cn from "clsx";
import {
  CYBER_FILTER_PANEL_CLASS,
  cyberFilterBarClasses,
} from "@/lib/ui/cyberFilterBar";
import type { ScheduleTeamOption } from "@/lib/games/useScheduleTeams";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import type { TeamFilterMatchMode } from "@/lib/games/gameTeamFilter";
import { t } from "@/lib/i18n/t";
import type { Language } from "@/lib/i18n/language";

type Props = {
  teams: ScheduleTeamOption[];
  /** 最大2件のチーム doc ID */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** 2チーム時のみ有効。URL の team_mode と同期 */
  matchMode: TeamFilterMatchMode;
  onMatchModeChange: (mode: TeamFilterMatchMode) => void;
  /** URL margin_min / margin_max（得点差の許容範囲。片方だけでも可） */
  marginMin: number | null;
  marginMax: number | null;
  onMarginMinMaxChange: (min: number | null, max: number | null) => void;
  /** チーム・点差・対決モードをまとめてクリア */
  onClearAllFilters: () => void;
  dense?: boolean;
  /** 試合一覧ヘッダー行に載せる極小トリガー（NBA タイトル横） */
  compactHeader?: boolean;
  language: Language;
  layoutMobile: boolean;
};

function parseMarginDraft(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 0 || n > 200) return null;
  return n;
}

const OVERLAY_Z = 1000000;

/** Framer Motion の transform が Tailwind の translate を上書きしないよう、中央寄せは motion で行う */
const DESKTOP_CENTER_MOTION = { x: "-50%", y: "-50%" } as const;

export default function GamesTeamFilterPanel({
  teams,
  selectedIds,
  onChange,
  matchMode,
  onMatchModeChange,
  marginMin,
  marginMax,
  onMarginMinMaxChange,
  onClearAllFilters,
  dense = false,
  compactHeader = false,
  language,
  layoutMobile,
}: Props) {
  const m = t(language);
  const reduceMotion = useReducedMotion();
  const tabFont = bracketMarketTeamTypography(layoutMobile);
  /** モバイルで number/search 入力にフォーカスしたとき、16px 未満だと iOS がページを拡大するのを防ぐ */
  const filterInputTextClass = layoutMobile
    ? "text-[16px] leading-normal"
    : dense
      ? "text-xs"
      : "text-sm";
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const [draftMarginMin, setDraftMarginMin] = useState("");
  const [draftMarginMax, setDraftMarginMax] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setDraftMarginMin(marginMin != null ? String(marginMin) : "");
    setDraftMarginMax(marginMax != null ? String(marginMax) : "");
  }, [open, marginMin, marginMax]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filteredTeams = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(needle));
  }, [teams, q]);

  const toggle = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter((x) => x !== id));
      } else if (selectedIds.length < 2) {
        onChange([...selectedIds, id]);
      }
    },
    [selectedIds, onChange],
  );

  const commitMargins = useCallback(() => {
    onMarginMinMaxChange(
      parseMarginDraft(draftMarginMin),
      parseMarginDraft(draftMarginMax),
    );
  }, [draftMarginMin, draftMarginMax, onMarginMinMaxChange]);

  const handleClearAll = useCallback(() => {
    onClearAllFilters();
  }, [onClearAllFilters]);

  const activeCount = selectedIds.length;
  const marginFilterActive = marginMin != null || marginMax != null;
  const labelShort = m.games.filter;

  const filterHelpText = useMemo(() => {
    if (activeCount === 0) {
      return language === "ja"
        ? "チームは選ばなくても、下の点差だけで絞れます（任意で最大2チーム）。点差は上下どちらか空欄ならその側は制限なし。未開始の試合はそのまま表示されます。"
        : "Team filter is optional—you can use only the score margin below. Up to 2 teams if you want. Empty min/max side = no bound on that side. Scheduled games stay visible.";
    }
    if (activeCount === 1) {
      const n = teams.find((t) => t.id === selectedIds[0])?.name ?? selectedIds[0];
      return language === "ja"
        ? `「${n}」が出る試合を表示しています。`
        : `Showing games that include ${n}.`;
    }
    const [id1, id2] = selectedIds;
    const n1 = teams.find((t) => t.id === id1)?.name ?? id1;
    const n2 = teams.find((t) => t.id === id2)?.name ?? id2;
    if (matchMode === "h2h") {
      return language === "ja"
        ? `「${n1}」対「${n2}」の試合だけを表示しています。`
        : `Showing only games between ${n1} and ${n2}.`;
    }
    return language === "ja"
      ? `「${n1}」または「${n2}」のどちらかが出る試合を表示しています（他チームとの対戦も含みます）。`
      : `Showing games where ${n1} or ${n2} plays—including games vs other teams.`;
  }, [activeCount, selectedIds, teams, matchMode, language]);

  const overlay = (
    <AnimatePresence>
      {open ? (
        <motion.button
          key="games-filter-backdrop"
          type="button"
          aria-label={m.games.closeOverlay}
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
          style={{ zIndex: OVERLAY_Z }}
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: reduceMotion ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          onClick={() => setOpen(false)}
        />
      ) : null}
      {open ? (
        <motion.div
          key="games-filter-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="games-team-filter-title"
          className={cn(
            "fixed flex flex-col overflow-hidden text-white",
            layoutMobile
              ? "inset-x-0 bottom-0 max-h-[min(85dvh,640px)] min-h-[min(40dvh,320px)] w-full rounded-t-[1.35rem] border border-cyan-400/20 border-b-0 bg-[#070d14]/96 shadow-[0_0_48px_rgba(34,211,238,0.12)] backdrop-blur-xl"
              : cn(
                  CYBER_FILTER_PANEL_CLASS,
                  "left-1/2 top-1/2 max-h-[min(80vh,620px)] w-[min(420px,calc(100vw-1.5rem))]",
                ),
          )}
          style={{ zIndex: OVERLAY_Z + 1 }}
          initial={
            reduceMotion
              ? false
              : layoutMobile
                ? { y: "100%", opacity: 1 }
                : { opacity: 0, scale: 0.97, ...DESKTOP_CENTER_MOTION }
          }
          animate={
            reduceMotion
              ? layoutMobile
                ? { opacity: 1, y: 0 }
                : { opacity: 1, ...DESKTOP_CENTER_MOTION }
              : layoutMobile
                ? { opacity: 1, y: 0 }
                : { opacity: 1, scale: 1, ...DESKTOP_CENTER_MOTION }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : layoutMobile
                ? { y: "100%", opacity: 1 }
                : { opacity: 0, scale: 0.97, ...DESKTOP_CENTER_MOTION }
          }
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 36,
            mass: 0.85,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {layoutMobile && (
            <div className="flex justify-center pt-2 pb-1" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
          )}

          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-3 md:px-5 md:pt-4">
            <div>
              <h2
                id="games-team-filter-title"
                className="text-[15px] font-bold tracking-wide text-white/95 md:text-base"
                style={tabFont}
              >
                {m.games.filterSchedule}
              </h2>
              <p className="mt-1 max-w-[min(100%,340px)] text-[11px] leading-relaxed text-white/45 md:text-xs">
                {filterHelpText}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white/80 transition hover:bg-white/10"
              aria-label={m.common.close}
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>

          <div className="border-b border-white/[0.06] px-4 py-2.5 md:px-5">
            <p
              className="mb-2 text-[10px] font-medium uppercase tracking-wide text-white/40"
              style={tabFont}
            >
              {m.games.marginRange}
            </p>
            <p className="mb-2 text-[10px] leading-relaxed text-white/38">
              {language === "ja"
                ? "得点差（大きい方の差）が、左の数以上かつ右の数以下の試合に絞ります（両方入れたとき）。例: 8 と 12 → 8〜12点差のみ。"
                : "|Home − Away| must be ≥ min and ≤ max (inclusive). Example: min 8, max 12 → wins by 8–12 points."}
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-[5.5rem] flex-1 flex-col gap-1">
                <span className="text-[10px] text-white/45" style={tabFont}>
                  {m.games.marginMin}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={200}
                  step={1}
                  value={draftMarginMin}
                  onChange={(e) => setDraftMarginMin(e.target.value)}
                  onBlur={commitMargins}
                  placeholder="—"
                  className={cn(
                    "w-full rounded-lg border border-white/12 bg-black/40 px-2 py-2 text-white/90 outline-none focus:border-cyan-400/40",
                    filterInputTextClass,
                  )}
                  style={tabFont}
                />
              </label>
              <label className="flex min-w-[5.5rem] flex-1 flex-col gap-1">
                <span className="text-[10px] text-white/45" style={tabFont}>
                  {m.games.marginMax}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={200}
                  step={1}
                  value={draftMarginMax}
                  onChange={(e) => setDraftMarginMax(e.target.value)}
                  onBlur={commitMargins}
                  placeholder="—"
                  className={cn(
                    "w-full rounded-lg border border-white/12 bg-black/40 px-2 py-2 text-white/90 outline-none focus:border-cyan-400/40",
                    filterInputTextClass,
                  )}
                  style={tabFont}
                />
              </label>
            </div>
          </div>

          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-white/[0.06] px-4 py-2.5 md:px-5">
              {selectedIds.map((id) => {
                const name = teams.find((t) => t.id === id)?.name ?? id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-medium text-cyan-100/95 transition hover:bg-cyan-500/25"
                    style={tabFont}
                  >
                    <span className="max-w-[200px] truncate">{name}</span>
                    <X size={12} className="opacity-70" aria-hidden />
                  </button>
                );
              })}
            </div>
          )}

          {activeCount === 2 && (
            <div className="border-b border-white/[0.06] px-4 py-2.5 md:px-5">
              <p
                className="mb-2 text-[10px] font-medium uppercase tracking-wide text-white/40"
                style={tabFont}
              >
                {m.games.matchListScope}
              </p>
              <div className="flex gap-1.5 rounded-xl border border-white/10 bg-black/35 p-1">
                <button
                  type="button"
                  onClick={() => onMatchModeChange("any")}
                  className={cn(
                    "min-h-9 flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition md:text-xs",
                    matchMode === "any"
                      ? "bg-cyan-500/25 text-cyan-50 ring-1 ring-cyan-400/35"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white/80",
                  )}
                  style={tabFont}
                >
                  {m.games.eitherTeam}
                </button>
                <button
                  type="button"
                  onClick={() => onMatchModeChange("h2h")}
                  className={cn(
                    "min-h-9 flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition md:text-xs",
                    matchMode === "h2h"
                      ? "bg-cyan-500/25 text-cyan-50 ring-1 ring-cyan-400/35"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white/80",
                  )}
                  style={tabFont}
                >
                  {m.games.h2hOnly}
                </button>
              </div>
            </div>
          )}

          <div className="px-4 py-2.5 md:px-5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                aria-hidden
              />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={m.games.searchTeams}
                className={cn(
                  "w-full rounded-xl border border-white/12 bg-black/40 py-2.5 pl-9 pr-3 text-white/90 outline-none ring-0 transition placeholder:text-white/35 focus:border-cyan-400/40 focus:bg-black/50",
                  filterInputTextClass,
                )}
                style={tabFont}
              />
            </div>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-1 md:px-4",
              "max-h-[min(46dvh,400px)]",
            )}
          >
            <div
              className="flex flex-col gap-1.5"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
              }}
            >
              {filteredTeams.map((t) => {
                const sel = selectedIds.includes(t.id);
                const atCap = selectedIds.length >= 2 && !sel;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={atCap}
                    onClick={() => toggle(t.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      sel
                        ? "border-cyan-400/40 bg-gradient-to-r from-cyan-500/14 to-transparent"
                        : "border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]",
                      atCap &&
                        "cursor-not-allowed opacity-40 hover:bg-white/[0.03]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold",
                        sel
                          ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-50"
                          : "border-white/14 text-transparent",
                      )}
                      aria-hidden
                    >
                      {sel ? "✓" : ""}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        dense ? "text-xs" : "text-sm",
                        sel ? "text-white" : "text-white/88",
                      )}
                      style={tabFont}
                    >
                      {t.name}
                    </span>
                  </button>
                );
              })}
              {filteredTeams.length === 0 && (
                <p className="py-8 text-center text-xs text-white/40">
                  {m.games.noTeamMatch}
                </p>
              )}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3 md:px-5">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={activeCount === 0 && !marginFilterActive}
              className="rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-white/70 transition enabled:hover:border-white/20 enabled:hover:bg-white/[0.05] disabled:opacity-35"
              style={tabFont}
            >
              {m.games.clearAll}
            </button>
            <button
              type="button"
              onClick={() => {
                commitMargins();
                setOpen(false);
                setQ("");
              }}
              className="rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/25"
              style={tabFont}
            >
              {m.common.done}
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={tabFont}
        className={cyberFilterBarClasses(
          activeCount > 0 || marginFilterActive,
          cn(
            "inline-flex shrink-0 items-center font-bold uppercase tracking-wide",
            compactHeader
              ? "inline-flex h-9 items-center gap-1.5 px-2.5 text-[10px] leading-none"
              : dense
                ? "inline-flex h-10 items-center gap-2 px-2.5 text-xs"
                : "inline-flex h-10 items-center gap-2 px-3 text-xs md:text-sm",
          )
        )}
      >
        <SlidersHorizontal
          className={cn(
            "shrink-0 opacity-90",
            compactHeader ? "h-3.5 w-3.5" : dense ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
          aria-hidden
        />
        <span>{labelShort}</span>
        {activeCount > 0 && (
          <span
            className={cn(
              "flex items-center justify-center rounded-md bg-cyan-400/25 text-cyan-50",
              compactHeader
                ? "h-4 min-w-4 px-0.5 text-[9px]"
                : "h-5 min-w-[1.25rem] px-1 text-[10px]",
            )}
          >
            {activeCount}
          </span>
        )}
        {activeCount === 2 && matchMode === "h2h" && !compactHeader && (
          <span
            className="max-w-[5.5rem] truncate rounded-md border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold normal-case leading-none text-cyan-100/95"
            style={tabFont}
          >
            {m.games.h2hShort}
          </span>
        )}
        {marginFilterActive && !compactHeader && (
          <span
            className="max-w-[7.5rem] truncate rounded-md border border-amber-400/35 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold normal-case leading-none text-amber-100/95"
            style={tabFont}
            title={
              marginMin != null && marginMax != null
                ? `${marginMin}–${marginMax}`
                : marginMin != null
                  ? `≥${marginMin}`
                  : `≤${marginMax}`
            }
          >
            {language === "ja"
              ? marginMin != null && marginMax != null
                ? `${marginMin}〜${marginMax}`
                : marginMin != null
                  ? `${marginMin}+`
                  : `${marginMax}以下`
              : marginMin != null && marginMax != null
                ? `${marginMin}–${marginMax}`
                : marginMin != null
                  ? `≥${marginMin}`
                  : `≤${marginMax}`}
          </span>
        )}
      </button>

      {mounted && typeof document !== "undefined"
        ? createPortal(overlay, document.body)
        : null}
    </>
  );
}
