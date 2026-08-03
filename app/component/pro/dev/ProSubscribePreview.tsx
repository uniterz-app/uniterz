"use client";

/**
 * Pro 課金プレビュー — プラン選択 →（お試しモーダル）→ 模擬購入 → 成功画面
 * 決済・IAP 未接続。UI ブラッシュアップ用。
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  CalendarRange,
  ChartNoAxesColumn,
  ChevronLeft,
  FileText,
  Image,
  Lightbulb,
  Medal,
  Radar,
  Swords,
} from "lucide-react";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
import { CyberScanlineText } from "@/app/component/rankings/CyberRankingListParts";
import {
  PRO_SUBSCRIBE_PREVIEW_PLANS,
  proSubscribePreviewPlanById,
  type ProSubscribeFeatureIcon,
  type ProSubscribePreviewPlan,
  type ProSubscribePreviewPlanId,
} from "@/lib/pro/proSubscribePreviewPlans";
import { PRO_SKIN_PATH } from "@/lib/pro/proSkinRoutes";
import { PRO_SUBSCRIBE_SUCCESS_MOTION as SM } from "@/lib/pro/proSubscribeSuccessMotion";
import { jp, nameOxanium } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { setAppBrandShelfHidden } from "@/lib/ui/appBrandShelfVisibility";
import { motion, useReducedMotion } from "framer-motion";
import cn from "clsx";

type Phase = "plans" | "purchasing" | "success";
type CheckoutKind = "trial" | "paid";

const FEATURE_ICONS: Record<
  ProSubscribeFeatureIcon,
  typeof Lightbulb
> = {
  insight: Lightbulb,
  alert: Bell,
  rank: ChartNoAxesColumn,
  badge: Medal,
  skin: Image,
  proLeague: Swords,
  weeklyReport: FileText,
  monthlyReport: Radar,
  season: CalendarRange,
};

type Props = {
  language?: Language;
  className?: string;
  /** カード左上の戻る。未指定時は非表示 */
  onBack?: () => void;
  backAriaLabel?: string;
  /** カード右上はてな。未指定時は非表示 */
  helpText?: string;
};

function trialAvailableFor(planId: ProSubscribePreviewPlanId): boolean {
  return planId === "weekly" || planId === "monthly";
}

/** プラン別アクセント（EAST ラベル風スキャンライン） */
const PLAN_ACCENT: Record<
  ProSubscribePreviewPlanId,
  { fill: string; border: string; glow: string; softBg: string }
> = {
  weekly: {
    fill: "#00F5FF",
    border: "rgba(0,245,255,0.45)",
    glow: "rgba(0,245,255,0.22)",
    softBg: "rgba(0,245,255,0.08)",
  },
  monthly: {
    fill: "#B8FF3C",
    border: "rgba(184,255,60,0.45)",
    glow: "rgba(184,255,60,0.2)",
    softBg: "rgba(184,255,60,0.08)",
  },
  season: {
    fill: "#FF8A1A",
    border: "rgba(255,138,26,0.5)",
    glow: "rgba(255,138,26,0.22)",
    softBg: "rgba(255,138,26,0.09)",
  },
};

function PlanScanLabel({
  label,
  accent,
}: {
  label: string;
  accent: string;
}) {
  return (
    <span
      className={[
        nameOxanium.className,
        "relative inline-flex h-[18px] items-center overflow-hidden px-1.5",
        "text-[9px] font-black uppercase leading-none tracking-[0.12em] text-[#050508]",
      ].join(" ")}
      style={{
        background: accent,
        boxShadow: `0 0 8px ${accent}44`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 1.5px, rgba(0,0,0,0.16) 1.5px, rgba(0,0,0,0.16) 2.5px)",
        }}
      />
      <span className="relative z-[1]">{label}</span>
    </span>
  );
}

export default function ProSubscribePreview({
  language = "ja",
  className,
  onBack,
  backAriaLabel = "戻る",
  helpText,
}: Props) {
  const pathname = usePathname() ?? "";
  const skinPickerHref = pathname.startsWith("/web")
    ? PRO_SKIN_PATH.web
    : PRO_SKIN_PATH.mobile;
  const ja = language === "ja";
  const [planId, setPlanId] = useState<ProSubscribePreviewPlanId | null>(null);
  const [phase, setPhase] = useState<Phase>("plans");
  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind>("paid");
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpMounted, setHelpMounted] = useState(false);
  const selected = planId ? proSubscribePreviewPlanById(planId) : null;

  useEffect(() => {
    setHelpMounted(true);
  }, []);

  useEffect(() => {
    const hide = phase === "success";
    setAppBrandShelfHidden(hide);
    return () => {
      if (hide) setAppBrandShelfHidden(false);
    };
  }, [phase]);

  useEffect(() => {
    if (!helpOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [helpOpen]);

  function togglePlan(id: ProSubscribePreviewPlanId) {
    setPlanId((prev) => (prev === id ? null : id));
  }

  function startPaid() {
    if (!planId || phase === "purchasing") return;
    setCheckoutKind("paid");
    setPhase("purchasing");
    window.setTimeout(() => setPhase("success"), 900);
  }

  function confirmTrialFromModal() {
    if (!planId) return;
    setTrialModalOpen(false);
    setCheckoutKind("trial");
    setPhase("purchasing");
    window.setTimeout(() => setPhase("success"), 900);
  }

  function reset() {
    setPhase("plans");
    setPlanId(null);
    setCheckoutKind("paid");
    setTrialModalOpen(false);
  }

  if (phase === "success" && selected && planId) {
    return (
      <div
        className={[
          "flex min-h-0 w-full flex-1 flex-col items-center justify-center",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="-translate-y-5 sm:-translate-y-6">
          <SuccessPanel
            ja={ja}
            planId={planId}
            planLabel={ja ? selected.labelJa : selected.labelEn}
            price={ja ? selected.priceJa : selected.priceEn}
            period={ja ? selected.periodJa : selected.periodEn}
            trial={checkoutKind === "trial"}
            skinPickerHref={skinPickerHref}
            onAgain={reset}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={["relative w-full", className].filter(Boolean).join(" ")}>
      <div
        className={[
          "relative overflow-hidden rounded-[2px] border border-amber-300/28",
          "bg-[linear-gradient(165deg,rgba(18,16,12,0.96)_0%,rgba(8,10,16,0.98)_55%,rgba(5,8,14,0.99)_100%)]",
          "px-3.5 py-5 sm:px-5 sm:py-6",
          "shadow-[0_20px_52px_rgba(0,0,0,0.55),0_0_28px_rgba(212,175,90,0.08)]",
        ].join(" ")}
      >
        <header className="mb-5">
          {(onBack || helpText) && (
            <div className="mb-3 flex items-center justify-between gap-2">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-[rgba(0,245,255,0.28)] bg-[rgba(0,245,255,0.06)] text-cyan-100 transition hover:border-[rgba(0,245,255,0.5)] hover:bg-[rgba(0,245,255,0.12)] active:scale-95"
                  style={{
                    clipPath:
                      "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
                  }}
                  aria-label={backAriaLabel}
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
                </button>
              ) : (
                <span className="h-10 w-10 shrink-0" aria-hidden />
              )}
              {helpText ? (
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-[rgba(0,245,255,0.22)] bg-[rgba(0,245,255,0.05)] transition hover:border-[rgba(0,245,255,0.45)] hover:bg-[rgba(0,245,255,0.1)]"
                  style={{
                    clipPath:
                      "polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px)",
                  }}
                  aria-label={ja ? "説明" : "Info"}
                  aria-expanded={helpOpen}
                >
                  <span
                    className={cn(
                      nameOxanium.className,
                      "text-[17px] font-black italic leading-none tracking-wide text-cyan-200/90"
                    )}
                    style={{
                      textShadow:
                        "0 0 6px rgba(0,245,255,0.55), 0 0 14px rgba(0,245,255,0.28)",
                    }}
                    aria-hidden
                  >
                    ?
                  </span>
                </button>
              ) : (
                <span className="h-10 w-10 shrink-0" aria-hidden />
              )}
            </div>
          )}
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <ProCyberBadge ariaLabel="UNITERZ Pro" />
            </div>
            <h1
              className={[
                nameOxanium.className,
                "text-[22px] font-extrabold uppercase tracking-[0.14em] text-white",
              ].join(" ")}
            >
              Get Pro
            </h1>
            <p
              className={[
                jp.className,
                "mt-2 text-[12px] leading-relaxed text-white/50",
              ].join(" ")}
            >
              {ja
                ? "プランをタップして、できることを確認。もう一度タップで閉じます。"
                : "Tap a plan to see what’s included. Tap again to close."}
            </p>
          </div>
        </header>

        {/* モバイル縦並び: タップでそのカード直下に機能が開閉 */}
        <div className="flex flex-col gap-2.5">
          {PRO_SUBSCRIBE_PREVIEW_PLANS.map((plan) => {
            const on = planId === plan.id;
            const accent = PLAN_ACCENT[plan.id];
            return (
              <div key={plan.id} className="flex flex-col">
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => togglePlan(plan.id)}
                  className={[
                    "relative rounded-[2px] border px-3 py-3.5 text-left transition",
                    on ? "" : "bg-white/[0.03] active:brightness-110",
                  ].join(" ")}
                  style={
                    on
                      ? {
                          borderColor: accent.border,
                          background: accent.softBg,
                          boxShadow: `inset 0 1px 0 ${accent.fill}33, 0 0 18px ${accent.glow}`,
                        }
                      : {
                          borderColor: accent.border,
                          background: "rgba(255,255,255,0.03)",
                        }
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <PlanScanLabel
                      label={ja ? plan.labelJa : plan.labelEn}
                      accent={accent.fill}
                    />
                    <div className="flex shrink-0 items-center gap-1.5">
                      {(plan.badgeJa || plan.recommended) && (
                        <span
                          className={[
                            nameOxanium.className,
                            "inline-flex h-[18px] items-center rounded-[2px] px-1.5 text-[8px] font-extrabold uppercase leading-none tracking-[0.08em]",
                            plan.badgeJa === "7日無料"
                              ? "text-[#120e08]"
                              : "border border-white/20 bg-black/40 text-white/70",
                          ].join(" ")}
                          style={
                            plan.badgeJa === "7日無料"
                              ? { background: accent.fill }
                              : undefined
                          }
                        >
                          {ja ? plan.badgeJa : plan.badgeEn}
                        </span>
                      )}
                      <span
                        className={[
                          nameOxanium.className,
                          "text-[12px] font-black leading-none transition",
                          on ? "rotate-180" : "text-white/35",
                        ].join(" ")}
                        style={on ? { color: accent.fill } : undefined}
                        aria-hidden
                      >
                        ▾
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <CyberScanlineText
                      subtle={false}
                      className={[
                        nameOxanium.className,
                        "text-[22px] font-black tabular-nums leading-none text-white",
                      ].join(" ")}
                    >
                      {ja ? plan.priceJa : plan.priceEn}
                    </CyberScanlineText>
                    <span
                      className={[
                        nameOxanium.className,
                        "text-[10px] font-bold tracking-wide text-white/45",
                      ].join(" ")}
                    >
                      {ja ? plan.periodJa : plan.periodEn}
                    </span>
                  </div>
                  <p
                    className={[
                      jp.className,
                      "mt-2 text-[11px] leading-snug text-white/45",
                    ].join(" ")}
                  >
                    {ja ? plan.blurbJa : plan.blurbEn}
                  </p>
                </button>

                {on ? (
                  <section
                    className="mt-0 border border-t-0 bg-black/35 px-3 py-3"
                    style={{ borderColor: accent.border }}
                    aria-label={ja ? "このプランでできること" : "Included"}
                  >
                    <p
                      className={[
                        nameOxanium.className,
                        "mb-2.5 text-[9px] font-extrabold uppercase tracking-[0.16em]",
                      ].join(" ")}
                      style={{ color: accent.fill }}
                    >
                      {ja ? "このプランでできること" : "Included"}
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => {
                        const Icon = FEATURE_ICONS[f.icon];
                        return (
                          <li
                            key={f.titleEn}
                            className="flex items-start gap-2.5"
                          >
                            <span
                              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border"
                              style={{
                                borderColor: `${accent.fill}73`,
                                background: `${accent.fill}26`,
                                color: accent.fill,
                              }}
                              aria-hidden
                            >
                              <Icon className="h-3 w-3" strokeWidth={2.4} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={[
                                  nameOxanium.className,
                                  "text-[11px] font-extrabold tracking-[0.04em] text-white/90",
                                ].join(" ")}
                              >
                                {ja ? f.titleJa : f.titleEn}
                              </p>
                              <p
                                className={[
                                  jp.className,
                                  "mt-0.5 text-[11px] leading-snug text-white/50",
                                ].join(" ")}
                              >
                                {ja ? f.detailJa : f.detailEn}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {trialAvailableFor(plan.id) ? (
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3.5">
                        <button
                          type="button"
                          disabled={phase === "purchasing"}
                          onClick={() => setTrialModalOpen(true)}
                          className={[
                            nameOxanium.className,
                            "w-full rounded-[2px] py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em] transition",
                            phase === "purchasing"
                              ? "cursor-wait bg-white/10 text-white/50"
                              : "bg-amber-300 text-[#120e08] hover:brightness-110 active:scale-[0.99]",
                          ].join(" ")}
                        >
                          {phase === "purchasing"
                            ? ja
                              ? "処理中…"
                              : "Processing…"
                            : ja
                              ? "7日間無料で試す"
                              : "Start 7-day free trial"}
                        </button>
                        <p
                          className={[
                            jp.className,
                            "text-center text-[11px] leading-relaxed text-white/50",
                          ].join(" ")}
                        >
                          {plan.id === "weekly"
                            ? ja
                              ? "お試し後は週額 ¥280。期間中の解約で課金なし。"
                              : "Then ¥280/week. Cancel during trial — no charge."
                            : ja
                              ? "お試し後は月額 ¥780。期間中の解約で課金なし。"
                              : "Then ¥780/month. Cancel during trial — no charge."}
                        </p>
                        <button
                          type="button"
                          disabled={phase === "purchasing"}
                          onClick={startPaid}
                          className={[
                            nameOxanium.className,
                            "w-full py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-white/70",
                          ].join(" ")}
                        >
                          {ja
                            ? `お試しなしで${plan.labelJa}を購入`
                            : `Buy ${plan.labelEn} (no trial)`}
                        </button>
                        <p className="text-center text-[10px] leading-relaxed text-white/35">
                          {ja
                            ? "※ 初回のみ。iOS は App Store のサブスク管理から解約できます。プレビューでは決済しません。"
                            : "※ First time only. On iOS, cancel in App Store subscriptions. Preview does not charge."}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3.5">
                        <button
                          type="button"
                          disabled={phase === "purchasing"}
                          onClick={startPaid}
                          className={[
                            nameOxanium.className,
                            "w-full rounded-[2px] py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em] transition",
                            phase === "purchasing"
                              ? "cursor-wait bg-white/10 text-white/50"
                              : "bg-amber-300 text-[#120e08] hover:brightness-110 active:scale-[0.99]",
                          ].join(" ")}
                        >
                          {phase === "purchasing"
                            ? ja
                              ? "処理中…"
                              : "Processing…"
                            : ja
                              ? `${plan.labelJa} を購入（プレビュー）`
                              : `Buy ${plan.labelEn} (preview)`}
                        </button>
                        <p className="text-center text-[10px] leading-relaxed text-white/35">
                          {ja
                            ? "※ 7日無料は Weekly / Monthly のみ。価格・特典は仮。決済は走りません。"
                            : "※ 7-day trial is Weekly / Monthly only. Prices are draft. No real charge."}
                        </p>
                      </div>
                    )}
                  </section>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {trialModalOpen && selected ? (
        <TrialExplainModal
          ja={ja}
          plan={selected}
          onClose={() => setTrialModalOpen(false)}
          onConfirm={confirmTrialFromModal}
        />
      ) : null}

      {helpMounted && helpText && helpOpen
        ? createPortal(
            <div className="fixed inset-0 z-[1000040] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label={ja ? "閉じる" : "Close"}
                className="absolute inset-0 bg-[#020609]/78"
                onClick={() => setHelpOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                className="relative z-[1] w-full max-w-md overflow-hidden rounded-sm border border-[rgba(0,245,255,0.32)] bg-[#050b14] px-5 py-4 shadow-[0_0_40px_rgba(0,245,255,0.14)]"
                onClick={(e) => e.stopPropagation()}
              >
                <p
                  className={[
                    nameOxanium.className,
                    "text-center text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/85",
                  ].join(" ")}
                >
                  Info
                </p>
                <p
                  className={[
                    jp.className,
                    "mt-3 text-center text-[13px] leading-relaxed text-white/75",
                  ].join(" ")}
                >
                  {helpText}
                </p>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className={[
                    nameOxanium.className,
                    "mt-4 w-full border border-[rgba(0,245,255,0.28)] bg-[rgba(0,245,255,0.06)] py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100",
                  ].join(" ")}
                >
                  {ja ? "閉じる" : "Close"}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function TrialExplainModal({
  ja,
  plan,
  onClose,
  onConfirm,
}: {
  ja: boolean;
  plan: ProSubscribePreviewPlan;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const afterPrice = ja
    ? `${plan.priceJa}${plan.periodJa}`
    : `${plan.priceEn}${plan.periodEn}`;

  const points = ja
    ? [
        "7日間無料で Pro を試せます。",
        "期間中に解約すれば、お金はかかりません。",
        `解約しなければ、自動で有料の ${plan.labelJa}（${afterPrice}）に切り替わります。`,
        "Weekly と Monthly の変更は、いつでもできます。",
      ]
    : [
        "Try Pro free for 7 days.",
        "Cancel during the trial and you won’t be charged.",
        `Unless you cancel, it switches to paid ${plan.labelEn} (${afterPrice}).`,
        "You can switch Weekly ⇔ Monthly anytime.",
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 pb-6 pt-10 sm:items-center sm:pb-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-explain-title"
      onClick={onClose}
    >
      <div
        className={[
          "w-full max-w-md rounded-[2px] border border-amber-300/35",
          "bg-[linear-gradient(165deg,rgba(18,16,12,0.98)_0%,rgba(8,10,16,0.99)_100%)]",
          "px-4 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.65)]",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="trial-explain-title"
          className={[
            nameOxanium.className,
            "text-center text-[14px] font-extrabold uppercase tracking-[0.14em] text-white",
          ].join(" ")}
        >
          {ja ? "お試しの前に" : "Before you start"}
        </p>
        <p className={[jp.className, "mt-2 text-center text-[12px] text-white/50"].join(" ")}>
          {ja
            ? `選択中: ${plan.labelJa} · 7日間無料`
            : `Selected: ${plan.labelEn} · 7-day free`}
        </p>

        <ul className="mt-4 space-y-3 border border-white/10 bg-black/30 px-3.5 py-3.5">
          {points.map((text) => (
            <li
              key={text}
              className={[jp.className, "flex gap-2.5 text-[13px] leading-relaxed text-white/80"].join(" ")}
            >
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onConfirm}
          className={[
            nameOxanium.className,
            "mt-4 w-full rounded-[2px] bg-amber-300 py-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#120e08]",
          ].join(" ")}
        >
          OK · GET PRO
        </button>
        <button
          type="button"
          onClick={onClose}
          className={[
            nameOxanium.className,
            "mt-2 w-full py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40",
          ].join(" ")}
        >
          {ja ? "もどる" : "Back"}
        </button>
      </div>
    </div>
  );
}

/** 成功カード — Uniterz サイバー HUD（シアン／エレクトリック） */
const SUCCESS_CYBER = {
  cyanGrid: "rgba(0,245,255,0.45)",
} as const;

function SuccessPanel({
  ja,
  planId,
  planLabel,
  price,
  period,
  trial,
  skinPickerHref,
  onAgain,
}: {
  ja: boolean;
  planId: ProSubscribePreviewPlanId;
  planLabel: string;
  price: string;
  period: string;
  trial: boolean;
  skinPickerHref: string;
  onAgain: () => void;
}) {
  const started = new Date().toLocaleDateString(ja ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  const trialEndLabel = trialEnd.toLocaleDateString(ja ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const title = trial
    ? ja
      ? "Pro お試し開始"
      : "Pro trial started"
    : "Upgrade to Pro";

  const statusLine = trial
    ? `7DAY_TRIAL // ${planLabel.toUpperCase()}`
    : `ACTIVE // ${planLabel.toUpperCase()}`;

  const reduceMotion = useReducedMotion();
  const motionOn = reduceMotion !== true;
  const easeOut = [0.22, 0.61, 0.36, 1] as const;

  return (
    <div className="flex w-full flex-col items-center px-1">
      <motion.div
        className="mb-4 flex items-center gap-2.5"
        initial={motionOn ? { opacity: 0, y: SM.headFromY } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: motionOn ? SM.headDelayMs / 1000 : 0,
          duration: motionOn ? SM.headMs / 1000 : 0,
          ease: easeOut,
        }}
      >
        <motion.span
          className={[
            "grid h-7 w-7 place-items-center rounded-full text-[13px] font-black",
            "bg-[#00F5FF] text-[#050508]",
          ].join(" ")}
          initial={
            motionOn
              ? { boxShadow: "0 0 8px rgba(0,245,255,0.28)" }
              : { boxShadow: "0 0 14px rgba(0,245,255,0.45)" }
          }
          animate={{
            boxShadow: motionOn
              ? [
                  "0 0 8px rgba(0,245,255,0.28)",
                  "0 0 22px rgba(0,245,255,0.7)",
                  "0 0 14px rgba(0,245,255,0.45)",
                ]
              : "0 0 14px rgba(0,245,255,0.45)",
          }}
          transition={{
            delay: motionOn ? SM.checkGlowDelayMs / 1000 : 0,
            duration: motionOn ? SM.checkGlowMs / 1000 : 0,
            times: motionOn ? [0, 0.45, 1] : undefined,
            ease: "easeOut",
          }}
        >
          ✓
        </motion.span>
        <h2
          className={[
            nameOxanium.className,
            "text-[17px] font-extrabold uppercase tracking-[0.14em] text-cyan-50",
          ].join(" ")}
        >
          {title}
        </h2>
      </motion.div>

      {/* 上=白ヘッダー / サイド=シアン オフセット＋Lブラケット */}
      <motion.div
        className="relative w-full max-w-[22.5rem] pb-[7px] pr-[7px] pt-2 pl-2"
        initial={
          motionOn
            ? { opacity: 0, y: SM.cardFromY, scale: SM.cardFromScale }
            : false
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: motionOn ? SM.cardMs / 1000 : 0,
          ease: easeOut,
        }}
      >
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-20 h-[18px] w-[18px] border-l-[3px] border-t-[3px] border-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.35)]"
          initial={motionOn ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{
            delay: motionOn ? SM.accentDelayMs / 1000 : 0,
            duration: motionOn ? SM.accentMs / 1000 : 0,
            ease: "easeOut",
          }}
        />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 z-20 h-[18px] w-[18px] border-b-[3px] border-r-[3px] border-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.35)]"
          initial={motionOn ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{
            delay: motionOn ? SM.accentDelayMs / 1000 : 0,
            duration: motionOn ? SM.accentMs / 1000 : 0,
            ease: "easeOut",
          }}
        />

        {/* Side accent — cyan offset plate */}
        <motion.div
          aria-hidden
          className="absolute bottom-0 right-0 top-2 left-2 z-0 bg-[#00F5FF]"
          style={{ boxShadow: "0 0 28px rgba(0,245,255,0.28)" }}
          initial={motionOn ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{
            delay: motionOn ? SM.accentDelayMs / 1000 : 0,
            duration: motionOn ? SM.accentMs / 1000 : 0,
            ease: "easeOut",
          }}
        />

        {/* Main frame — white border */}
        <div
          className="relative z-10 border-[2.5px] border-white bg-[#04080f]"
          style={{
            boxShadow:
              "0 0 24px rgba(34,211,238,0.14), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Top — white header bar + scanlines（CyberSlantedTab と同型） */}
          <div className="relative flex items-stretch overflow-hidden border-b-[2.5px] border-white bg-white">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px)",
              }}
            />
            <div className="relative z-[1] min-w-0 flex-1 px-3 py-2.5">
              <p
                className={[
                  nameOxanium.className,
                  "text-[8px] font-bold uppercase tracking-[0.16em] text-black/55",
                ].join(" ")}
              >
                {trial ? "TRIAL_CONFIRMED // TYPE: PRO" : "UPGRADE_CONFIRMED // TYPE: PRO"}
              </p>
              <p
                className={[
                  nameOxanium.className,
                  "mt-0.5 text-[18px] font-black uppercase leading-none tracking-[0.08em] text-black",
                ].join(" ")}
              >
                {trial ? "TRIAL ON" : "PRO ON"}
              </p>
            </div>
            <div
              className={[
                nameOxanium.className,
                "relative z-[1] flex shrink-0 flex-col justify-center border-l-[2.5px] border-black/15 px-2.5 py-2 text-right text-[8px] font-bold uppercase leading-tight tracking-[0.06em] text-black/70",
              ].join(" ")}
            >
              <span>PLAN: {planLabel.toUpperCase()}</span>
              <span className="mt-0.5">
                {trial ? "AUTH: TRIAL" : "AUTH: PAID"}
              </span>
            </div>
          </div>

          <div className="relative px-3 pb-3 pt-4">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.28]"
              style={{
                backgroundImage: `radial-gradient(${SUCCESS_CYBER.cyanGrid} 0.55px, transparent 0.55px)`,
                backgroundSize: "7px 7px",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(0,245,255,0.1), transparent 70%)",
              }}
            />

            <div
              className="relative mx-auto flex max-w-[15rem] flex-col items-center gap-2.5 border border-cyan-400/35 bg-[rgba(4,10,18,0.88)] px-3 py-5"
              style={{
                boxShadow:
                  "inset 0 0 24px rgba(0,245,255,0.06), 0 0 18px rgba(34,211,238,0.08)",
              }}
            >
              <div className="relative flex flex-col items-center gap-2.5 overflow-hidden px-1 py-0.5">
                <ProCyberBadge ariaLabel="UNITERZ Pro" premium />
                <p
                  className={[
                    nameOxanium.className,
                    "text-[20px] font-semibold tracking-[0.22em] text-cyan-50",
                  ].join(" ")}
                >
                  UNITERZ
                </p>
                {motionOn ? (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-[-30%] left-0 w-[38%] skew-x-[-18deg] mix-blend-screen"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.92) 50%, rgba(186,250,255,0.5) 64%, transparent 100%)",
                    }}
                    initial={{ x: "-130%", opacity: 0 }}
                    animate={{ x: "280%", opacity: [0, 1, 1, 0] }}
                    transition={{
                      delay: SM.brandSheenDelayMs / 1000,
                      duration: SM.brandSheenMs / 1000,
                      ease: [0.22, 0.61, 0.36, 1],
                      times: [0, 0.12, 0.78, 1],
                    }}
                  />
                ) : null}
              </div>
              <div className="h-px w-14 bg-[#00F5FF] shadow-[0_0_8px_rgba(0,245,255,0.55)]" />
              <p
                className={[
                  nameOxanium.className,
                  "text-center text-[10px] font-bold uppercase tracking-[0.1em] text-cyan-100/70",
                ].join(" ")}
              >
                {statusLine}
              </p>
              <p
                className={[
                  nameOxanium.className,
                  "text-[12px] font-black tabular-nums tracking-[0.04em] text-[#00F5FF]",
                  "drop-shadow-[0_0_8px_rgba(0,245,255,0.35)]",
                ].join(" ")}
              >
                {trial ? (ja ? "無料 → その後 " : "FREE → THEN ") : ""}
                {price}
                {trial ? period : ""}
              </p>
            </div>

            <div className="relative mt-3 space-y-1.5 border-t border-cyan-400/30 pt-3">
              {trial ? (
                <>
                  <MetaRow label="START" value={started} />
                  <MetaRow label="ENDS" value={trialEndLabel} />
                  <MetaRow
                    label="CHARGE"
                    value={ja ? "期間中解約で課金なし" : "Cancel in trial = ¥0"}
                  />
                </>
              ) : (
                <>
                  <MetaRow label="START" value={started} />
                  <MetaRow label="PLAN_ID" value={planId} />
                </>
              )}
            </div>

            <div className="relative mt-3 grid gap-2">
              <Link
                href={skinPickerHref}
                className={[
                  nameOxanium.className,
                  "flex w-full items-center justify-center border-2 border-[#00F5FF] bg-transparent py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#00F5FF]",
                  "shadow-[0_0_16px_rgba(0,245,255,0.18)]",
                  "transition hover:bg-[#00F5FF] hover:text-[#050508] hover:shadow-[0_0_22px_rgba(0,245,255,0.4)] active:scale-[0.99]",
                ].join(" ")}
              >
                {ja ? "Pro Skinを試す" : "Try Pro Skin"}
              </Link>
              <button
                type="button"
                onClick={onAgain}
                className={[
                  nameOxanium.className,
                  "w-full border border-cyan-400/35 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100/50",
                  "transition hover:border-cyan-300/60 hover:text-cyan-100/85",
                ].join(" ")}
              >
                {ja ? "プラン選択に戻る" : "Back to plans"}
              </button>
            </div>

            <p
              className={[
                nameOxanium.className,
                "relative mt-2.5 text-center text-[8px] font-bold uppercase tracking-[0.12em] text-cyan-400/35",
              ].join(" ")}
            >
              SYS_LOG · PREVIEW_MOCK · NO_CHARGE
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={[
          nameOxanium.className,
          "shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200/40",
        ].join(" ")}
      >
        {label}
      </span>
      <span
        className={[
          nameOxanium.className,
          "min-w-0 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#00F5FF]",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
