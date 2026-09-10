"use client";

/**
 * Pro 課金プレビュー — プラン選択 →（お試しモーダル）→ 模擬購入 → 成功画面
 * 決済・IAP 未接続。UI ブラッシュアップ用。
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ComponentProps,
} from "react";
import {
  Bell,
  CalendarRange,
  ChartNoAxesColumn,
  FileText,
  Image,
  Lightbulb,
  Medal,
  Radar,
  Swords,
} from "lucide-react";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import { CyberScanlineText } from "@/app/component/rankings/CyberRankingListParts";
import {
  PRO_SUBSCRIBE_PREVIEW_PLANS,
  proSubscribePreviewPlanById,
  type ProSubscribeFeatureIcon,
  type ProSubscribePreviewPlan,
  type ProSubscribePreviewPlanId,
} from "@/lib/pro/proSubscribePreviewPlans";
import {
  PRO_LEGAL_PATHS_MOBILE,
  PRO_LEGAL_PATHS_WEB,
  PRO_SUBSCRIBE_PLAN_DIFF_ROWS,
  planDiffCellLabel,
  planDiffColLabel,
  planDiffRowLabel,
  planDiffTitle,
  proLegalLinkLabel,
  proSubscribeAfterTrialNote,
  proSubscribeBuyPreviewLabel,
  proSubscribeBuyWithoutTrialLabel,
  proSubscribeCancelInTrialValue,
  proSubscribeFreeThenPrefix,
  proSubscribeIncludedTitle,
  proSubscribeLead,
  proSubscribeNoTrialMicroNote,
  proSubscribeProcessingLabel,
  proSubscribeStartTrialLabel,
  proSubscribeSuccessTitle,
  proSubscribeTrialMicroNote,
  proSubscribeTrialModalPoints,
  proSubscribeTrialModalSelected,
  proSubscribeTrialModalTitle,
  proSubscribeTryProSkinLabel,
  purchaseDisclaimer,
  seasonPassBlurb,
  seasonPassTargetLabel,
  trialConditionLines,
  trialConditionsTitle,
  type ProLegalLinkKind,
} from "@/lib/pro/proSubscribePurchaseCopy";
import { proSkinHref } from "@/lib/pro/proSkinRoutes";
import { PRO_SUBSCRIBE_SUCCESS_MOTION as SM } from "@/lib/pro/proSubscribeSuccessMotion";
import { PRO_SUCCESS_ACCENT } from "@/lib/pro/proSuccessAccent";
import { jp, nameOxanium } from "@/lib/fonts";
import { DATE_LOCALE, type Language } from "@/lib/i18n/language";
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import { acquireAppBrandShelfHidden, setAppBrandShelfHidden } from "@/lib/ui/appBrandShelfVisibility";
import { motion, useReducedMotion } from "framer-motion";

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
  /** トライアル成功画面中は true（親で BACK タブを隠す用） */
  onTrialSuccessChange?: (active: boolean) => void;
};

/** 押し込みフィードバック（モバイルでも :active より確実） */
function PressAnimButton({
  className,
  pressedClassName = "scale-[0.94] brightness-110",
  disabled,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pressedClassName?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const on = pressed && !disabled;
  return (
    <button
      {...rest}
      disabled={disabled}
      onPointerDown={(e) => {
        if (!disabled) setPressed(true);
        rest.onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(false);
        rest.onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(false);
        rest.onPointerLeave?.(e);
      }}
      onPointerCancel={(e) => {
        setPressed(false);
        rest.onPointerCancel?.(e);
      }}
      className={[
        className,
        "transition-[transform,filter,background-color,opacity,box-shadow] duration-150 ease-out",
        on ? pressedClassName : "scale-100",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

function PressAnimLink({
  className,
  pressedClassName = "scale-[0.94] brightness-110",
  children,
  ...rest
}: ComponentProps<typeof Link> & { pressedClassName?: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Link
      {...rest}
      onPointerDown={(e) => {
        setPressed(true);
        rest.onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(false);
        rest.onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(false);
        rest.onPointerLeave?.(e);
      }}
      onPointerCancel={(e) => {
        setPressed(false);
        rest.onPointerCancel?.(e);
      }}
      className={[
        className,
        "transition-[transform,filter,background-color,opacity,box-shadow] duration-150 ease-out",
        pressed ? pressedClassName : "scale-100",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Link>
  );
}

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
  onTrialSuccessChange,
}: Props) {
  const pathname = usePathname() ?? "";
  const isWeb = pathname.startsWith("/web");
  const skinPickerHref = proSkinHref(isWeb ? "web" : "mobile");
  const legalPaths = isWeb ? PRO_LEGAL_PATHS_WEB : PRO_LEGAL_PATHS_MOBILE;
  const lang = resolveLocalizedLang(language);
  const seasonLabel = seasonPassTargetLabel(lang);
  const seasonBlurb = seasonPassBlurb(lang);
  const [planId, setPlanId] = useState<ProSubscribePreviewPlanId | null>(null);
  const [phase, setPhase] = useState<Phase>("plans");
  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind>("paid");
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const selected = planId ? proSubscribePreviewPlanById(planId) : null;

  useEffect(() => {
    if (phase !== "success") return;
    return acquireAppBrandShelfHidden();
  }, [phase]);

  useEffect(() => {
    const trialSuccess = phase === "success" && checkoutKind === "trial";
    onTrialSuccessChange?.(trialSuccess);
    return () => {
      onTrialSuccessChange?.(false);
    };
  }, [phase, checkoutKind, onTrialSuccessChange]);

  // 離脱時に forceHidden が残ってヘッダー消えたままになるのを防ぐ
  useEffect(() => {
    return () => {
      setAppBrandShelfHidden(false);
    };
  }, []);

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
            lang={lang}
            planId={planId}
            planLabel={selected.label}
            price={selected.price}
            period={
              planId === "season" ? seasonLabel : L(lang, selected.period)
            }
            trial={checkoutKind === "trial"}
            skinPickerHref={
              checkoutKind === "trial"
                ? proSkinHref(isWeb ? "web" : "mobile", { fromTrial: true })
                : skinPickerHref
            }
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
              {proSubscribeLead(lang)}
            </p>
          </div>
        </header>

        <PlanDiffTable lang={lang} />

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
                      label={plan.label}
                      accent={accent.fill}
                    />
                    <div className="flex shrink-0 items-center gap-1.5">
                      {(plan.badge || plan.recommended) && (
                        <span
                          className={[
                            nameOxanium.className,
                            "inline-flex h-[18px] items-center rounded-[2px] px-1.5 text-[8px] font-extrabold uppercase leading-none tracking-[0.08em]",
                            plan.badgeHighlight
                              ? "text-[#120e08]"
                              : "border border-white/20 bg-black/40 text-white/70",
                          ].join(" ")}
                          style={
                            plan.badgeHighlight
                              ? { background: accent.fill }
                              : undefined
                          }
                        >
                          {plan.badge ? L(lang, plan.badge) : ""}
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
                      {plan.price}
                    </CyberScanlineText>
                    <span
                      className={[
                        nameOxanium.className,
                        "text-[10px] font-bold tracking-wide text-white/45",
                      ].join(" ")}
                    >
                      {plan.id === "season"
                        ? seasonLabel
                        : L(lang, plan.period)}
                    </span>
                  </div>
                  <p
                    className={[
                      jp.className,
                      "mt-2 text-[11px] leading-snug text-white/45",
                    ].join(" ")}
                  >
                    {plan.id === "season" ? seasonBlurb : L(lang, plan.blurb)}
                  </p>
                </button>

                {on ? (
                  <section
                    className="mt-0 border border-t-0 bg-black/35 px-3 py-3"
                    style={{ borderColor: accent.border }}
                    aria-label={proSubscribeIncludedTitle(lang)}
                  >
                    <p
                      className={[
                        nameOxanium.className,
                        "mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em]",
                      ].join(" ")}
                      style={{ color: accent.fill }}
                    >
                      {proSubscribeIncludedTitle(lang)}
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => {
                        const Icon = FEATURE_ICONS[f.icon];
                        return (
                          <li
                            key={f.icon}
                            className="flex items-start gap-2.5"
                          >
                            <span
                              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] border"
                              style={{
                                borderColor: `${accent.fill}73`,
                                background: `${accent.fill}26`,
                                color: accent.fill,
                              }}
                              aria-hidden
                            >
                              <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={[
                                  nameOxanium.className,
                                  "text-[12px] font-extrabold tracking-[0.04em] text-white/90",
                                ].join(" ")}
                              >
                                {L(lang, f.title)}
                              </p>
                              <p
                                className={[
                                  jp.className,
                                  "mt-0.5 text-[12px] leading-snug text-white/50",
                                ].join(" ")}
                              >
                                {L(lang, f.detail)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {trialAvailableFor(plan.id) ? (
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3.5">
                        <PressAnimButton
                          type="button"
                          disabled={phase === "purchasing"}
                          onClick={() => setTrialModalOpen(true)}
                          pressedClassName="scale-[0.94] brightness-105"
                          className={[
                            nameOxanium.className,
                            "w-full rounded-[2px] py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em]",
                            phase === "purchasing"
                              ? "cursor-wait bg-white/10 text-white/50"
                              : "bg-amber-300 text-[#120e08] hover:brightness-110",
                          ].join(" ")}
                        >
                          {phase === "purchasing"
                            ? proSubscribeProcessingLabel(lang)
                            : proSubscribeStartTrialLabel(lang)}
                        </PressAnimButton>
                        <p
                          className={[
                            jp.className,
                            "text-center text-[11px] leading-relaxed text-white/50",
                          ].join(" ")}
                        >
                          {proSubscribeAfterTrialNote(
                            lang,
                            plan.id === "weekly" ? "weekly" : "monthly"
                          )}
                        </p>
                        <PressAnimButton
                          type="button"
                          disabled={phase === "purchasing"}
                          onClick={startPaid}
                          pressedClassName="scale-[0.96] text-white/85"
                          className={[
                            nameOxanium.className,
                            "w-full py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 hover:text-white/70",
                          ].join(" ")}
                        >
                          {proSubscribeBuyWithoutTrialLabel(lang, plan.label)}
                        </PressAnimButton>
                        <p className="text-center text-[10px] leading-relaxed text-white/35">
                          {proSubscribeTrialMicroNote(lang)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3.5">
                        <PressAnimButton
                          type="button"
                          disabled={phase === "purchasing"}
                          onClick={startPaid}
                          pressedClassName="scale-[0.94] brightness-105"
                          className={[
                            nameOxanium.className,
                            "w-full rounded-[2px] py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em]",
                            phase === "purchasing"
                              ? "cursor-wait bg-white/10 text-white/50"
                              : "bg-amber-300 text-[#120e08] hover:brightness-110",
                          ].join(" ")}
                        >
                          {phase === "purchasing"
                            ? proSubscribeProcessingLabel(lang)
                            : proSubscribeBuyPreviewLabel(lang, plan.label)}
                        </PressAnimButton>
                        <p className="text-center text-[10px] leading-relaxed text-white/35">
                          {proSubscribeNoTrialMicroNote(lang)}
                        </p>
                      </div>
                    )}
                  </section>
                ) : null}
              </div>
            );
          })}
        </div>

        <PurchaseFootnotes lang={lang} legalPaths={legalPaths} />
      </div>

      {trialModalOpen && selected ? (
        <TrialExplainModal
          lang={lang}
          plan={selected}
          onClose={() => setTrialModalOpen(false)}
          onConfirm={confirmTrialFromModal}
        />
      ) : null}
    </div>
  );
}

function PlanDiffTable({ lang }: { lang: LocalizedLang }) {
  const cols = ["weekly", "monthly", "season"] as const;
  return (
    <section
      className="mb-4 overflow-hidden rounded-[2px] border border-white/12 bg-black/30"
      aria-label={planDiffTitle(lang)}
    >
      <p
        className={[
          nameOxanium.className,
          "border-b border-white/10 px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-200/85",
        ].join(" ")}
      >
        {planDiffTitle(lang)}
      </p>
      <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.9fr))] gap-px bg-white/10">
        <div className="bg-[#0a0e16] px-2 py-2" />
        {cols.map((col) => (
          <div
            key={col}
            className={[
              nameOxanium.className,
              "bg-[#0a0e16] px-1.5 py-2 text-center text-[8px] font-extrabold uppercase tracking-[0.06em] text-white/55",
            ].join(" ")}
          >
            {planDiffColLabel(col, lang)}
          </div>
        ))}
        {PRO_SUBSCRIBE_PLAN_DIFF_ROWS.map((row) => (
          <div key={row.id} className="contents">
            <div
              className={[
                jp.className,
                "bg-[#080c14] px-2 py-2.5 text-[11px] leading-snug text-white/70",
              ].join(" ")}
            >
              {planDiffRowLabel(row, lang)}
            </div>
            {cols.map((col) => {
              const cell = row[col];
              const on = cell === "yes";
              return (
                <div
                  key={`${row.id}-${col}`}
                  className={[
                    nameOxanium.className,
                    "bg-[#080c14] px-1.5 py-2.5 text-center text-[10px] font-extrabold tracking-[0.04em]",
                    on ? "text-amber-200" : "text-white/30",
                  ].join(" ")}
                >
                  {planDiffCellLabel(cell, lang)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function PurchaseFootnotes({
  lang,
  legalPaths,
}: {
  lang: LocalizedLang;
  legalPaths: typeof PRO_LEGAL_PATHS_MOBILE | typeof PRO_LEGAL_PATHS_WEB;
}) {
  const links: ProLegalLinkKind[] = ["terms", "privacy", "tokushoho"];
  return (
    <div className="mt-5 space-y-3.5 border-t border-white/10 pt-4">
      <section aria-label={trialConditionsTitle(lang)}>
        <p
          className={[
            nameOxanium.className,
            "text-[9px] font-extrabold uppercase tracking-[0.16em] text-cyan-200/80",
          ].join(" ")}
        >
          {trialConditionsTitle(lang)}
        </p>
        <ul className="mt-2 space-y-1.5">
          {trialConditionLines(lang).map((line) => (
            <li
              key={line}
              className={[
                jp.className,
                "text-[11px] leading-snug text-white/50",
              ].join(" ")}
            >
              · {line}
            </li>
          ))}
        </ul>
      </section>

      <p
        className={[
          jp.className,
          "text-center text-[11px] leading-relaxed text-white/40",
        ].join(" ")}
      >
        {purchaseDisclaimer(lang)}
      </p>

      <nav
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
        aria-label={L(lang, {
          ja: "規約",
          en: "Legal",
          ko: "약관",
          zh: "条款",
          es: "Legal",
          pt: "Jurídico",
          fr: "Mentions légales",
        })}
      >
        {links.map((kind, i) => (
          <span key={kind} className="inline-flex items-center gap-2">
            {i > 0 ? (
              <span className="text-white/25" aria-hidden>
                |
              </span>
            ) : null}
            <Link
              href={legalPaths[kind]}
              className={[
                jp.className,
                "text-[11px] text-cyan-200/75 underline-offset-2 hover:text-cyan-100 hover:underline",
              ].join(" ")}
            >
              {proLegalLinkLabel(kind, lang)}
            </Link>
          </span>
        ))}
      </nav>
    </div>
  );
}

function TrialExplainModal({
  lang,
  plan,
  onClose,
  onConfirm,
}: {
  lang: LocalizedLang;
  plan: ProSubscribePreviewPlan;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const afterPrice = `${plan.price}${L(lang, plan.period)}`;
  const points = proSubscribeTrialModalPoints(lang, plan.label, afterPrice);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-10"
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
          {proSubscribeTrialModalTitle(lang)}
        </p>
        <p className={[jp.className, "mt-2 text-center text-[12px] text-white/50"].join(" ")}>
          {proSubscribeTrialModalSelected(lang, plan.label)}
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

        <PressAnimButton
          type="button"
          onClick={onConfirm}
          pressedClassName="scale-[0.94] brightness-105"
          className={[
            nameOxanium.className,
            "mt-4 w-full rounded-[2px] bg-amber-300 py-3 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#120e08]",
          ].join(" ")}
        >
          OK · GET PRO
        </PressAnimButton>
        <PressAnimButton
          type="button"
          onClick={onClose}
          pressedClassName="scale-[0.96] text-white/70"
          className={[
            nameOxanium.className,
            "mt-2 w-full py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40",
          ].join(" ")}
        >
          {L(lang, {
            ja: "もどる",
            en: "Back",
            ko: "뒤로",
            zh: "返回",
            es: "Atrás",
            pt: "Voltar",
            fr: "Retour",
          })}
        </PressAnimButton>
      </div>
    </div>
  );
}

/** 成功カード — Trial=シアン / 有料アップグレード=グリーン */
function SuccessPanel({
  lang,
  planId,
  planLabel,
  price,
  period,
  trial,
  skinPickerHref,
}: {
  lang: LocalizedLang;
  planId: ProSubscribePreviewPlanId;
  planLabel: string;
  price: string;
  period: string;
  trial: boolean;
  skinPickerHref: string;
}) {
  const A = trial ? PRO_SUCCESS_ACCENT.trial : PRO_SUCCESS_ACCENT.billing;
  const dateLocale = DATE_LOCALE[lang];
  const started = new Date().toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  const trialEndLabel = trialEnd.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const title = proSubscribeSuccessTitle(lang, trial);

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
          className="grid h-7 w-7 place-items-center rounded-full text-[13px] font-black"
          style={{ backgroundColor: A.main, color: A.ink }}
          initial={
            motionOn
              ? { boxShadow: `0 0 8px rgba(${A.mainRgb},0.28)` }
              : { boxShadow: `0 0 14px rgba(${A.mainRgb},0.45)` }
          }
          animate={{
            boxShadow: motionOn
              ? [
                  `0 0 8px rgba(${A.mainRgb},0.28)`,
                  `0 0 22px rgba(${A.mainRgb},0.7)`,
                  `0 0 14px rgba(${A.mainRgb},0.45)`,
                ]
              : `0 0 14px rgba(${A.mainRgb},0.45)`,
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
            "text-[17px] font-extrabold uppercase tracking-[0.14em]",
          ].join(" ")}
          style={{ color: A.title }}
        >
          {title}
        </h2>
      </motion.div>

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
          className="pointer-events-none absolute left-0 top-0 z-20 h-[18px] w-[18px] border-l-[3px] border-t-[3px]"
          style={{
            borderColor: A.main,
            boxShadow: `0 0 10px rgba(${A.mainRgb},0.35)`,
          }}
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
          className="pointer-events-none absolute bottom-0 right-0 z-20 h-[18px] w-[18px] border-b-[3px] border-r-[3px]"
          style={{
            borderColor: A.main,
            boxShadow: `0 0 10px rgba(${A.mainRgb},0.35)`,
          }}
          initial={motionOn ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{
            delay: motionOn ? SM.accentDelayMs / 1000 : 0,
            duration: motionOn ? SM.accentMs / 1000 : 0,
            ease: "easeOut",
          }}
        />

        <motion.div
          aria-hidden
          className="absolute bottom-0 right-0 top-2 left-2 z-0"
          style={{
            backgroundColor: A.main,
            boxShadow: `0 0 28px rgba(${A.mainRgb},0.28)`,
          }}
          initial={motionOn ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{
            delay: motionOn ? SM.accentDelayMs / 1000 : 0,
            duration: motionOn ? SM.accentMs / 1000 : 0,
            ease: "easeOut",
          }}
        />

        <div
          className="relative z-10 border-[2.5px] border-white bg-[#04080f]"
          style={{
            boxShadow: `0 0 24px rgba(${A.mainRgb},0.14), inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
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
                {trial
                  ? "TRIAL_CONFIRMED // TYPE: PRO"
                  : "UPGRADE_CONFIRMED // TYPE: PRO"}
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
                backgroundImage: `radial-gradient(${A.gridDot} 0.55px, transparent 0.55px)`,
                backgroundSize: "7px 7px",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 80% 55% at 50% 18%, rgba(${A.mainRgb},0.1), transparent 70%)`,
              }}
            />

            <div
              className="relative mx-auto flex max-w-[15rem] flex-col items-center gap-2.5 bg-[rgba(4,10,18,0.88)] px-3 py-5"
              style={{
                border: `1px solid ${A.borderSoft}`,
                boxShadow: `inset 0 0 24px rgba(${A.mainRgb},0.06), 0 0 18px rgba(${A.mainRgb},0.08)`,
              }}
            >
              <div className="relative flex flex-col items-center gap-2.5 overflow-hidden px-1 py-0.5">
                <ProCyberBadge ariaLabel="UNITERZ Pro" premium />
                <div className="relative w-[168px] max-w-full">
                  <UniterzLogo width="100%" title="UNITERZ" />
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
              </div>
              <div
                className="h-px w-14"
                style={{
                  backgroundColor: A.main,
                  boxShadow: `0 0 8px rgba(${A.mainRgb},0.55)`,
                }}
              />
              <p
                className={[
                  nameOxanium.className,
                  "text-center text-[10px] font-bold uppercase tracking-[0.1em]",
                ].join(" ")}
                style={{ color: A.muted }}
              >
                {statusLine}
              </p>
              <p
                className={[
                  nameOxanium.className,
                  "text-[12px] font-black tabular-nums tracking-[0.04em]",
                ].join(" ")}
                style={{
                  color: A.main,
                  textShadow: `0 0 8px rgba(${A.mainRgb},0.35)`,
                }}
              >
                {trial ? proSubscribeFreeThenPrefix(lang) : ""}
                {price}
                {trial ? period : ""}
              </p>
            </div>

            <div
              className="relative mt-3 space-y-1.5 border-t pt-3"
              style={{ borderColor: A.borderSoft }}
            >
              {trial ? (
                <>
                  <MetaRow accent={A} label="START" value={started} />
                  <MetaRow accent={A} label="ENDS" value={trialEndLabel} />
                  <MetaRow
                    accent={A}
                    label="CHARGE"
                    value={proSubscribeCancelInTrialValue(lang)}
                  />
                </>
              ) : (
                <>
                  <MetaRow accent={A} label="START" value={started} />
                  <MetaRow accent={A} label="PLAN_ID" value={planId} />
                </>
              )}
            </div>

            <div className="relative mt-3 grid gap-2">
              <PressAnimLink
                href={skinPickerHref}
                pressedClassName="scale-[0.94] brightness-110"
                className={[
                  nameOxanium.className,
                  "flex w-full items-center justify-center border-2 bg-transparent py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.14em]",
                ].join(" ")}
                style={{
                  borderColor: A.main,
                  color: A.main,
                  boxShadow: `0 0 16px rgba(${A.mainRgb},0.18)`,
                }}
              >
                {proSubscribeTryProSkinLabel(lang)}
              </PressAnimLink>
            </div>

            <p
              className={[
                nameOxanium.className,
                "relative mt-2.5 text-center text-[8px] font-bold uppercase tracking-[0.12em]",
              ].join(" ")}
              style={{ color: `rgba(${A.mainRgb},0.35)` }}
            >
              SYS_LOG · PREVIEW_MOCK · NO_CHARGE
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: (typeof PRO_SUCCESS_ACCENT)[keyof typeof PRO_SUCCESS_ACCENT];
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={[
          nameOxanium.className,
          "shrink-0 text-[9px] font-bold uppercase tracking-[0.14em]",
        ].join(" ")}
        style={{ color: accent.metaLabel }}
      >
        {label}
      </span>
      <span
        className={[
          nameOxanium.className,
          "min-w-0 text-right text-[11px] font-bold uppercase tracking-[0.04em]",
        ].join(" ")}
        style={{ color: accent.main }}
      >
        {value}
      </span>
    </div>
  );
}
