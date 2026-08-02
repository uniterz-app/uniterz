"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal, CircleHelp, X } from "lucide-react";
import cn from "clsx";
import {
  CYBER_FILTER_PANEL_CLASS,
} from "@/lib/ui/cyberFilterBar";
import { gamesHeaderFilterButtonClasses } from "@/lib/ui/gamesHeaderBar";
import type { ScheduleTeamOption } from "@/lib/games/useScheduleTeams";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import type { TeamFilterMatchMode } from "@/lib/games/gameTeamFilter";
import { t } from "@/lib/i18n/t";
import type { Language } from "@/lib/i18n/language";
import CountryFlag from "@/app/component/games/CountryFlag";
import { teamIdToWcCountry } from "@/lib/legacyWcWebShims";
import {
  gamesFilterHelpButtonLabel,
  gamesFilterHelpParagraphs,
} from "@/lib/games/gamesFilterHelp";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  teams: ScheduleTeamOption[];
  /** 選択中のチーム doc ID */
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

function FilterTeamFlag({ teamId }: { teamId: string }) {
  if (!teamIdToWcCountry(teamId)) return null;
  return (
    <CountryFlag
      teamId={teamId}
      variant="inline"
      decorative
      className="shrink-0"
    />
  );
}

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const [draftMarginMin, setDraftMarginMin] = useState("");
  const [draftMarginMax, setDraftMarginMax] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setQ("");
    else setHelpOpen(false);
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
      } else {
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

  const helpParagraphs = useMemo(
    () =>
      gamesFilterHelpParagraphs({
        language,
        selectedIds,
        teams,
        matchMode,
      }),
    [language, selectedIds, teams, matchMode],
  );
  const helpButtonLabel = gamesFilterHelpButtonLabel(language);

  const panelBody = (
    <div className="games-filter-panel-shell">
      <div className="games-filter-panel-grid" aria-hidden />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        {layoutMobile && (
          <div className="flex justify-center pt-2 pb-1" aria-hidden>
            <div className="h-1 w-12 rounded-full bg-cyan-400/35 shadow-[0_0_10px_rgba(34,211,238,0.35)]" />
          </div>
        )}

        <div className="games-filter-panel-header md:px-5 md:pt-4">
          <div className="min-w-0 flex-1">
            <p className={nameOxanium.className + " games-filter-kicker"}>
              {language === "ja" ? "FILTER // 試合" : "FILTER // SCHEDULE"}
            </p>
            <h2
              id="games-team-filter-title"
              className="text-[15px] font-bold tracking-wide text-white/95 md:text-base"
              style={tabFont}
            >
              {m.games.filterSchedule}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              aria-expanded={helpOpen}
              aria-controls="games-team-filter-help"
              className={cn(
                "games-filter-icon-btn",
                helpOpen && "games-filter-icon-btn--active",
              )}
              style={tabFont}
            >
              <CircleHelp size={15} strokeWidth={2.2} aria-hidden />
              <span>{helpButtonLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="games-filter-icon-btn games-filter-icon-btn--square"
              aria-label={m.common.close}
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {helpOpen ? (
            <motion.div
              id="games-team-filter-help"
              key="games-filter-help"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              className="overflow-hidden border-b border-cyan-400/10 bg-cyan-500/[0.04]"
            >
              <div className="space-y-2 px-4 py-3 md:px-5">
                {helpParagraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-[11px] leading-relaxed text-white/50 md:text-xs"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {activeCount > 0 ? (
          <div
            className={cn(
              "games-filter-selection-bar",
              activeCount === 2 && "games-filter-selection-bar--dual",
            )}
          >
            <div className="games-filter-chip-row">
              {selectedIds.map((id) => {
                const name = teams.find((t) => t.id === id)?.name ?? id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className="games-filter-chip"
                    style={tabFont}
                  >
                    <FilterTeamFlag teamId={id} />
                    <span className="max-w-[200px] truncate">{name}</span>
                    <X size={12} className="opacity-70" aria-hidden />
                  </button>
                );
              })}
            </div>
            {activeCount === 2 ? (
              <div className="games-filter-scope-inline">
                <p className="games-filter-scope-label" style={tabFont}>
                  {m.games.matchListScope}
                </p>
                <div className="games-filter-seg-track games-filter-seg-track--compact">
                  <button
                    type="button"
                    onClick={() => onMatchModeChange("any")}
                    className={cn(
                      "games-filter-seg-btn games-filter-seg-btn--compact",
                      matchMode === "any" && "games-filter-seg-btn--active",
                    )}
                    style={tabFont}
                  >
                    {m.games.eitherTeam}
                  </button>
                  <button
                    type="button"
                    onClick={() => onMatchModeChange("h2h")}
                    className={cn(
                      "games-filter-seg-btn games-filter-seg-btn--compact",
                      matchMode === "h2h" && "games-filter-seg-btn--active",
                    )}
                    style={tabFont}
                  >
                    {m.games.h2hOnly}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            "games-filter-team-search-primary",
            activeCount === 2 && "games-filter-team-search-primary--dual",
          )}
        >
          <div className="games-filter-team-search-head">
            <p className="games-filter-section-label mb-2" style={tabFont}>
              {language === "ja" ? "チーム検索" : "TEAM SEARCH"}
            </p>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan-300/45"
                aria-hidden
              />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={m.games.searchTeams}
                className={cn("games-filter-search", filterInputTextClass)}
                style={tabFont}
              />
            </div>
          </div>

          <div className="games-filter-team-search-list">
            <div
              className="flex flex-col gap-1"
              style={{
                paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
              }}
            >
              {filteredTeams.map((t) => {
                const sel = selectedIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    className={cn(
                      "games-filter-team-row",
                      sel && "games-filter-team-row--selected",
                    )}
                  >
                    <span
                      className={cn(
                        "games-filter-check",
                        sel && "games-filter-check--on",
                      )}
                      aria-hidden
                    >
                      {sel ? "✓" : ""}
                    </span>
                    <FilterTeamFlag teamId={t.id} />
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
        </div>

        <div
          className={cn(
            "games-filter-margin-wrap border-t border-cyan-400/10",
            activeCount === 2 && "games-filter-margin-wrap--dual",
          )}
        >
          <div className="games-filter-margin-glass">
            <div className="games-filter-margin-inline">
              <p className="games-filter-margin-kicker" style={tabFont}>
                <span className="games-filter-margin-kicker-mark" aria-hidden />
                {m.games.marginRange}
              </p>
              <div className="games-filter-margin-fields">
                <label className="games-filter-margin-field">
                  <span style={tabFont}>{m.games.marginMin}</span>
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
                      "games-filter-input games-filter-input--glass",
                      filterInputTextClass,
                    )}
                    style={tabFont}
                  />
                </label>
                <label className="games-filter-margin-field">
                  <span style={tabFont}>{m.games.marginMax}</span>
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
                      "games-filter-input games-filter-input--glass",
                      filterInputTextClass,
                    )}
                    style={tabFont}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="games-filter-footer md:px-5">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={activeCount === 0 && !marginFilterActive}
            className="games-filter-clear-btn"
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
            className="games-filter-done-btn predict-overlay-submit-btn"
            style={tabFont}
          >
            {m.common.done}
          </button>
        </div>
      </div>
    </div>
  );

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
      {open && layoutMobile ? (
        <motion.div
          key="games-filter-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="games-team-filter-title"
          className={cn(
            CYBER_FILTER_PANEL_CLASS,
            "games-filter-panel--sheet",
            "fixed inset-x-0 bottom-0 z-[1000001] flex w-full flex-col",
            activeCount === 2
              ? "max-h-[min(92dvh,720px)] min-h-[min(52dvh,380px)]"
              : "max-h-[min(85dvh,640px)] min-h-[min(40dvh,320px)]",
          )}
          initial={reduceMotion ? false : { y: "100%", opacity: 1 }}
          animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { y: "100%", opacity: 1 }
          }
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 36,
            mass: 0.85,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {panelBody}
        </motion.div>
      ) : null}
      {open && !layoutMobile ? (
        <motion.div
          key="games-filter-panel-wrap"
          className="pointer-events-none fixed inset-0 z-[1000001] flex items-center justify-center p-3"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="games-team-filter-title"
            className={cn(
              CYBER_FILTER_PANEL_CLASS,
              "pointer-events-auto flex max-h-[min(80vh,620px)] w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden text-white",
            )}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 36,
              mass: 0.85,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {panelBody}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={compactHeader ? labelShort : undefined}
        style={compactHeader ? undefined : tabFont}
        className={gamesHeaderFilterButtonClasses(
          activeCount > 0 || marginFilterActive,
          compactHeader,
          compactHeader
            ? "relative z-30 w-9 min-w-9 max-w-9 gap-0 px-0"
            : "relative z-30 " +
              (!compactHeader && dense ? "gap-2 px-2.5" : !compactHeader ? "gap-2 px-3" : ""),
        )}
      >
        <SlidersHorizontal
          className={cn(
            "shrink-0 opacity-90",
            compactHeader ? "h-3.5 w-3.5" : dense ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
          aria-hidden
        />
        {!compactHeader ? <span>{labelShort}</span> : null}
        {!compactHeader && activeCount > 0 && (
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
