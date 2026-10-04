"use client";

/** Native `MatchScoreDisplaySettingsNative` 相当 — 設定画面のスコア表示トグル（押した瞬間に保存） */
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useMatchScoreDisplayPrefs } from "@/lib/games/useMatchScoreDisplayPrefs";
import {
  matchScoreDisplayCopy,
  type MatchScoreDisplayPrefKey,
} from "@/lib/games/matchScoreDisplayPrefs";

export default function MatchScoreDisplaySettings() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { language } = useUserLanguage(uid);
  const { prefs, updatePref } = useMatchScoreDisplayPrefs(uid);
  const copy = matchScoreDisplayCopy(language);

  const rows: Array<{ key: MatchScoreDisplayPrefKey; title: string; desc: string }> = [
    { key: "showLiveScore", title: copy.liveTitle, desc: copy.liveDesc },
    { key: "showFinalScore", title: copy.finalTitle, desc: copy.finalDesc },
  ];

  return (
    <section className="border border-cyan-300/20 bg-black/30 p-3.5">
      <p className="text-[12px] font-extrabold tracking-[0.1em] text-cyan-200">
        {copy.section}
      </p>
      <p className="mt-1 mb-1 text-[11px] leading-4 text-white/45">{copy.hint}</p>
      {rows.map((row, index) => {
        const on = prefs[row.key];
        return (
          <div
            key={row.key}
            className={`flex items-center gap-3 py-2.5 ${
              index > 0 ? "border-t border-white/10" : ""
            }`}
          >
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[14px] font-semibold text-white/95">{row.title}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{row.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={row.title}
              disabled={!uid}
              onClick={() => void updatePref(row.key, !on)}
              className={`relative h-7 w-11 shrink-0 border transition-colors ${
                on
                  ? "border-cyan-300/70 bg-cyan-500/55"
                  : "border-white/15 bg-slate-800"
              } ${!uid ? "opacity-40" : ""}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 bg-white transition-transform ${
                  on ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        );
      })}
    </section>
  );
}
