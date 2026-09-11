"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import NotificationProGateModal from "@/app/component/settings/NotificationProGateModal";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useUserPlan } from "@/hooks/useUserPlan";
import { usePushNotificationPrefs } from "@/lib/notifications/usePushNotificationPrefs";
import {
  PREDICTION_DEADLINE_MINUTE_OPTIONS,
  isProOnlyPrefKey,
  type PredictionDeadlineMinutes,
  type PushNotificationPrefKey,
} from "@/lib/notifications/pushNotificationPrefs";
import { nameOxanium } from "@/lib/fonts";

type Variant = "mobile" | "web";

type PrefRow = {
  key: PushNotificationPrefKey;
  titleJa: string;
  titleEn: string;
  descJa: string;
  descEn: string;
};

const MATCH_PREF_ROWS: PrefRow[] = [
  {
    key: "gameFinal",
    titleJa: "結果確定",
    titleEn: "Result confirmed",
    descJa: "予想した試合の結果が確定したとき（スコアは出ません）",
    descEn: "When a match you predicted is finalized (no score spoiler)",
  },
  {
    key: "predictionDeadline",
    titleJa: "予想締切",
    titleEn: "Prediction deadline",
    descJa: "未予想だけ。複数あるときは1通にまとめる",
    descEn: "Unpredicted only — batched into one when several",
  },
  {
    key: "unitReward",
    titleJa: "Unit 付与",
    titleEn: "Unit rewards",
    descJa: "ランキング報酬の Unit が付与されたとき",
    descEn: "When ranking Unit rewards are granted",
  },
];

const PRO_PREF_ROWS: PrefRow[] = [
  {
    key: "injuryStatus",
    titleJa: "出場ステータス変更",
    titleEn: "Availability change",
    descJa: "平均出場 25 分以上の選手の欠場・復帰など",
    descEn: "Out / return for players averaging 25+ minutes",
  },
  {
    key: "proInsightUpdate",
    titleJa: "PRO INSIGHT 重要更新",
    titleEn: "PRO INSIGHT update",
    descJa: "結論が変わったときだけ",
    descEn: "Only when the conclusion changes",
  },
  {
    key: "monthlyReport",
    titleJa: "月次レポート",
    titleEn: "Monthly report",
    descJa: "月次レポートが確定したとき",
    descEn: "When your monthly report is ready",
  },
];

function PrefSwitch({
  on,
  disabled,
  onChange,
}: {
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-11 shrink-0 border transition-colors ${
        on
          ? "border-cyan-300/70 bg-cyan-500/55"
          : "border-white/15 bg-slate-800"
      } ${disabled ? "opacity-40" : ""}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 bg-white transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/** Native `NotificationSettingsScreenNative` 相当 */
export default function NotificationSettingsPage({
  variant,
}: {
  variant: Variant;
}) {
  const router = useRouter();
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { language } = useUserLanguage(uid);
  const isJa = language === "ja";
  const gateLanguage = isJa ? "ja" : "en";
  const { isPro } = useUserPlan(uid ?? undefined);
  const { prefs, loading, updatePref, updateDeadlineMinutes } =
    usePushNotificationPrefs(uid);
  const [proGateOpen, setProGateOpen] = useState(false);
  const controlsEnabled = Boolean(uid) && !loading;

  useEffect(() => {
    if (loading || !uid || isPro) return;
    if (prefs.predictionDeadlineMinutes !== 30) {
      void updateDeadlineMinutes(30);
    }
  }, [
    loading,
    uid,
    isPro,
    prefs.predictionDeadlineMinutes,
    updateDeadlineMinutes,
  ]);

  const labels = isJa
    ? {
        description:
          "受け取る通知の種類を選べます。配信はアプリを入れた端末へ届きます。",
        osSection: "配信先",
        osHint: "プッシュはアプリ側の端末通知がオンのときに届きます。種類はここで選べます。",
        matchSection: "試合の進行",
        matchHint: "予想した試合の結果・Unit、未予想の締切まとめ。",
        deadlineSection: "締切の何分前",
        deadlineFreeHint: "Free は 30 分前。60 / 10 分前は Pro。",
        reviewSection: "予想を見直す",
        reviewHintPro: "欠場・Insight など、予想を直すべき変化だけ。",
        reviewHintFree:
          "出場ステータス・Insight・月次レポートは Pro で届きます。",
        signIn: "ログインすると保存できます。",
      }
    : {
        description:
          "Choose which notifications you receive. They arrive on a device with the app installed.",
        osSection: "Delivery",
        osHint: "Pushes land when device notifications are on in the app. Types are chosen here.",
        matchSection: "Match progress",
        matchHint:
          "Results and Units for matches you predicted — plus batched deadlines.",
        deadlineSection: "Minutes before deadline",
        deadlineFreeHint: "Free is 30 min. Pro unlocks 60 / 10.",
        reviewSection: "Recheck alerts",
        reviewHintPro: "Only availability / Insight changes that warrant a recheck.",
        reviewHintFree:
          "Availability, Insight, and monthly report are Pro.",
        signIn: "Sign in to save these settings.",
      };

  function openProGate() {
    setProGateOpen(true);
  }

  function handlePrefChange(key: PushNotificationPrefKey, value: boolean) {
    if (!controlsEnabled) return;
    if (isProOnlyPrefKey(key) && !isPro) {
      openProGate();
      return;
    }
    void updatePref(key, value);
  }

  function handleDeadline(minutes: PredictionDeadlineMinutes) {
    if (!isPro && minutes !== 30) {
      openProGate();
      return;
    }
    if (!controlsEnabled) return;
    void updateDeadlineMinutes(minutes);
  }

  function renderRows(rows: PrefRow[], locked: boolean) {
    return rows.map((row, index) => (
      <div
        key={row.key}
        className={`flex items-center gap-3 py-2.5 ${
          index > 0 ? "border-t border-white/10" : ""
        }`}
      >
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={locked ? openProGate : undefined}
          disabled={!locked}
        >
          <p className={`text-[14px] font-semibold ${locked ? "text-white/60" : "text-white/95"}`}>
            {isJa ? row.titleJa : row.titleEn}
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
            {isJa ? row.descJa : row.descEn}
          </p>
        </button>
        <PrefSwitch
          on={locked ? false : prefs[row.key]}
          disabled={!controlsEnabled && !locked}
          onChange={(next) => handlePrefChange(row.key, next)}
        />
      </div>
    ));
  }

  const subscribeHref =
    variant === "web" ? "/web/pro/subscribe" : "/mobile/pro/subscribe";

  return (
    <ProfileCyberPage title="ALERTS" subtitle={labels.description}>
      {!uid ? (
        <p className="mb-3 text-[13px] text-white/70">{labels.signIn}</p>
      ) : null}

      <section className="mb-3 border border-cyan-300/20 bg-black/30 p-3.5">
        <p
          className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400`}
        >
          {labels.osSection}
        </p>
        <div className="mt-2 flex items-start gap-2">
          <Bell className="mt-0.5 h-[18px] w-[18px] shrink-0 text-cyan-300" />
          <p className="text-[13px] leading-5 text-white/80">{labels.osHint}</p>
        </div>
      </section>

      <section className="mb-3 border border-cyan-300/20 bg-black/30 p-3.5">
        <p
          className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400`}
        >
          {labels.matchSection}
        </p>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">
          {labels.matchHint}
        </p>
        <div className="mt-1">{renderRows(MATCH_PREF_ROWS, false)}</div>
        {prefs.predictionDeadline ? (
          <div className="mt-2 border-t border-white/10 pt-3">
            <p className="text-[12px] font-bold text-white/90">
              {labels.deadlineSection}
            </p>
            {!isPro ? (
              <p className="mt-1 text-[11px] leading-4 text-slate-400">
                {labels.deadlineFreeHint}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {PREDICTION_DEADLINE_MINUTE_OPTIONS.map((minutes) => {
                const selected = prefs.predictionDeadlineMinutes === minutes;
                const locked = !isPro && minutes !== 30;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => handleDeadline(minutes)}
                    disabled={!controlsEnabled && !locked}
                    className={`inline-flex items-center gap-1.5 border px-3 py-2 text-[12px] font-bold ${
                      selected
                        ? "border-cyan-300/65 bg-cyan-500/20 text-cyan-50"
                        : locked
                          ? "border-[rgba(251,191,36,0.28)] bg-slate-950/40 text-slate-400"
                          : "border-white/20 bg-slate-950/60 text-slate-300"
                    }`}
                  >
                    {minutes}
                    {isJa ? "分前" : "m"}
                    {locked ? (
                      <span className="inline-flex scale-[0.72]">
                        <ProCyberBadge ariaLabel="PRO" compact />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mb-3 border border-cyan-300/20 bg-black/30 p-3.5">
        <div className="flex items-center gap-2">
          <p
            className={`${nameOxanium.className} text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400`}
          >
            {labels.reviewSection}
          </p>
          <ProCyberBadge ariaLabel="PRO" compact />
        </div>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">
          {isPro ? labels.reviewHintPro : labels.reviewHintFree}
        </p>
        <div className="mt-1">{renderRows(PRO_PREF_ROWS, !isPro)}</div>
      </section>

      <NotificationProGateModal
        open={proGateOpen}
        language={gateLanguage}
        onClose={() => setProGateOpen(false)}
        onSeePro={() => {
          setProGateOpen(false);
          router.push(subscribeHref);
        }}
      />
    </ProfileCyberPage>
  );
}
