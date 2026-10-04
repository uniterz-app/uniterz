"use client";

/** Native `FirstRunSetupModalNative` 相当 — 新規登録直後の通知・スコア表示の確認 */
import { useEffect, useState } from "react";
import { nameOxanium } from "@/lib/fonts";
import { useMatchScoreDisplayPrefs } from "@/lib/games/useMatchScoreDisplayPrefs";
import {
  matchScoreDisplayCopy,
  type MatchScoreDisplayPrefKey,
} from "@/lib/games/matchScoreDisplayPrefs";
import { firstRunSetupCopy } from "@/lib/onboarding/firstRunSetup";
import { usePushNotificationPrefs } from "@/lib/notifications/usePushNotificationPrefs";
import { FREE_NOTIFICATION_PREF_KEYS_FOR_SETUP } from "@/lib/onboarding/firstRunSetupWeb";

type Props = {
  open: boolean;
  uid: string | null;
  language: string;
  onStart: (opts: { notify: boolean }) => void;
};

function SetupSwitch({
  on,
  label,
  onChange,
}: {
  on: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-11 shrink-0 border transition-colors ${
        on ? "border-cyan-300/70 bg-cyan-500/55" : "border-white/15 bg-slate-800"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 bg-white transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function FirstRunSetupModal({ open, uid, language, onStart }: Props) {
  const t = firstRunSetupCopy(language);
  const scoreCopy = matchScoreDisplayCopy(language);
  const { prefs, updatePref } = useMatchScoreDisplayPrefs(uid);
  const { updatePref: updatePushPref } = usePushNotificationPrefs(uid);
  const [notify, setNotify] = useState(true);

  // Web はプッシュ許可が無いので、オフ選択は通知設定（アプリ配信）側をオフにする
  const handleStart = () => {
    if (!notify) {
      for (const key of FREE_NOTIFICATION_PREF_KEYS_FOR_SETUP) void updatePushPref(key, false);
    }
    onStart({ notify });
  };

  useEffect(() => {
    if (open) setNotify(true);
  }, [open]);

  if (!open) return null;

  const scoreRows: Array<{ key: MatchScoreDisplayPrefKey; title: string; desc: string }> = [
    { key: "showLiveScore", title: scoreCopy.liveTitle, desc: scoreCopy.liveDesc },
    { key: "showFinalScore", title: scoreCopy.finalTitle, desc: scoreCopy.finalDesc },
  ];

  const sectionTitleClass = `${nameOxanium.className} mt-3.5 mb-1.5 text-[11px] font-bold tracking-[0.12em] text-cyan-200/90`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="relative w-full max-w-[340px] border border-cyan-300/30 bg-black px-[18px] pb-[18px] pt-4 shadow-[0_0_24px_rgba(0,245,255,0.1)]"
      >
        <p
          className={`${nameOxanium.className} text-center text-[17px] font-bold tracking-[0.04em] text-slate-50`}
        >
          {t.title}
        </p>
        <p className="mt-1.5 text-center text-[12px] leading-[17px] text-slate-400">{t.body}</p>

        <p className={sectionTitleClass}>{t.notifySection}</p>
        <div className="border border-cyan-300/20 bg-cyan-300/[0.04] px-3">
          <div className="flex items-center gap-2.5 py-2.5">
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[13px] font-bold text-white/95">{t.notifyTitle}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                {t.notifyDesc}
                <br />
                {t.notifyWebHint}
              </p>
            </div>
            <SetupSwitch on={notify} label={t.notifyTitle} onChange={setNotify} />
          </div>
        </div>

        <p className={sectionTitleClass}>{t.scoreSection}</p>
        <div className="border border-cyan-300/20 bg-cyan-300/[0.04] px-3">
          {scoreRows.map((row, index) => (
            <div
              key={row.key}
              className={`flex items-center gap-2.5 py-2.5 ${
                index > 0 ? "border-t border-white/10" : ""
              }`}
            >
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[13px] font-bold text-white/95">{row.title}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{row.desc}</p>
              </div>
              <SetupSwitch
                on={prefs[row.key]}
                label={row.title}
                onChange={(next) => void updatePref(row.key, next)}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleStart}
          className={`${nameOxanium.className} mt-[18px] w-full border border-cyan-300/60 bg-cyan-400/25 py-3 text-[14px] font-bold tracking-[0.08em] text-cyan-50 transition-colors hover:bg-cyan-400/35`}
        >
          {t.start}
        </button>
      </div>
    </div>
  );
}
