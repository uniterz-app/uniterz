"use client";

import { useMemo, useState } from "react";
import type { ScheduleTeamOption } from "@/lib/games/useScheduleTeams";
import type { Language } from "@/lib/i18n/language";
import { MAX_RANKING_TEAM_IDS } from "@/lib/communities/rankingTeams";

type Props = {
  teams: ScheduleTeamOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  language: Language;
  isWeb?: boolean;
};

export default function CommunityTeamPicker({
  teams,
  selectedIds,
  onChange,
  language,
  isWeb = false,
}: Props) {
  const [q, setQ] = useState("");

  const labels = useMemo(
    () =>
      language === "en"
        ? {
            search: "Search teams…",
            hint: `Optional — up to ${MAX_RANKING_TEAM_IDS} teams. Leave empty for the whole league.`,
            selected: "Selected",
            clear: "Clear",
          }
        : {
            search: "チームを検索…",
            hint: `任意 — 最大 ${MAX_RANKING_TEAM_IDS} チーム。未選択の場合はリーグ全体が対象です。`,
            selected: "選択中",
            clear: "クリア",
          },
    [language]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(needle));
  }, [teams, q]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
      return;
    }
    if (selectedIds.length >= MAX_RANKING_TEAM_IDS) return;
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <p
        className={[
          "leading-relaxed text-white/45",
          isWeb ? "text-sm" : "text-[11px]",
        ].join(" ")}
      >
        {labels.hint}
      </p>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              "text-white/45",
              isWeb ? "text-xs" : "text-[10px]",
            ].join(" ")}
          >
            {labels.selected}:
          </span>
          {selectedIds.map((id) => {
            const name = teams.find((t) => t.id === id)?.name ?? id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={[
                  "rounded-full border border-cyan-400/35 bg-cyan-500/15 font-medium text-cyan-100",
                  isWeb ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
                ].join(" ")}
              >
                {name} ×
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onChange([])}
            className={[
              "text-white/40 underline-offset-2 hover:text-white/65 hover:underline",
              isWeb ? "text-xs" : "text-[10px]",
            ].join(" ")}
          >
            {labels.clear}
          </button>
        </div>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={labels.search}
        className={[
          "w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white placeholder:text-white/30",
          isWeb ? "py-2.5 text-base" : "py-2 text-sm",
        ].join(" ")}
      />

      <div
        className={[
          "max-h-40 overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-black/25 p-1",
          isWeb ? "max-h-48" : "",
        ].join(" ")}
      >
        {filtered.length === 0 ? (
          <p
            className={[
              "px-2 py-3 text-center text-white/35",
              isWeb ? "text-sm" : "text-xs",
            ].join(" ")}
          >
            —
          </p>
        ) : (
          filtered.map((t) => {
            const on = selectedIds.includes(t.id);
            const disabled =
              !on && selectedIds.length >= MAX_RANKING_TEAM_IDS;
            return (
              <button
                key={t.id}
                type="button"
                disabled={disabled}
                onClick={() => toggle(t.id)}
                className={[
                  "flex w-full items-center gap-2 rounded-lg px-2.5 text-left transition-colors",
                  isWeb ? "py-2 text-base" : "py-1.5 text-sm",
                  on
                    ? "bg-cyan-500/20 text-cyan-50"
                    : "text-white/75 hover:bg-white/5",
                  disabled ? "cursor-not-allowed opacity-40" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    on
                      ? "border-cyan-300 bg-cyan-400/30"
                      : "border-white/20",
                  ].join(" ")}
                  aria-hidden
                >
                  {on ? "✓" : ""}
                </span>
                <span className="min-w-0 truncate">{t.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
