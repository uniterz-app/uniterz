"use client";

/**
 * Pro 課金プレビュー — プラン選択 →（お試しモーダル）→ 模擬購入 → 成功画面
 * 決済・IAP 未接続。UI ブラッシュアップ用。
 */

import { useState } from "react";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
import {
  PRO_SUBSCRIBE_PREVIEW_PLANS,
  proSubscribePreviewPlanById,
  type ProSubscribePreviewPlan,
  type ProSubscribePreviewPlanId,
} from "@/lib/pro/proSubscribePreviewPlans";
import { jp, nameOxanium } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";

type Phase = "plans" | "purchasing" | "success";
type CheckoutKind = "trial" | "paid";

type Props = {
  language?: Language;
  className?: string;
};

function trialAvailableFor(planId: ProSubscribePreviewPlanId): boolean {
  return planId === "weekly" || planId === "monthly";
}

export default function ProSubscribePreview({
  language = "ja",
  className,
}: Props) {
  const ja = language === "ja";
  const [planId, setPlanId] = useState<ProSubscribePreviewPlanId>("monthly");
  const [phase, setPhase] = useState<Phase>("plans");
  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind>("paid");
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const selected = proSubscribePreviewPlanById(planId);
  const trialAvailable = trialAvailableFor(planId);

  function startPaid() {
    if (phase === "purchasing") return;
    setCheckoutKind("paid");
    setPhase("purchasing");
    window.setTimeout(() => setPhase("success"), 900);
  }

  function confirmTrialFromModal() {
    setTrialModalOpen(false);
    setCheckoutKind("trial");
    setPhase("purchasing");
    window.setTimeout(() => setPhase("success"), 900);
  }

  function reset() {
    setPhase("plans");
    setCheckoutKind("paid");
    setTrialModalOpen(false);
  }

  if (phase === "success") {
    return (
      <div className={["w-full", className].filter(Boolean).join(" ")}>
        <SuccessPanel
          ja={ja}
          planId={planId}
          planLabel={ja ? selected.labelJa : selected.labelEn}
          price={ja ? selected.priceJa : selected.priceEn}
          period={ja ? selected.periodJa : selected.periodEn}
          trial={checkoutKind === "trial"}
          onAgain={reset}
        />
      </div>
    );
  }

  const afterTrialPriceLine = ja
    ? planId === "weekly"
      ? "お試し後は週額 ¥280。期間中の解約で課金なし。"
      : "お試し後は月額 ¥600。期間中の解約で課金なし。"
    : planId === "weekly"
      ? "Then ¥280/week. Cancel during trial — no charge."
      : "Then ¥600/month. Cancel during trial — no charge.";

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
        <header className="mb-5 text-center">
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
          <p className={[jp.className, "mt-2 text-[12px] leading-relaxed text-white/50"].join(" ")}>
            {ja
              ? "プランを選んで、できることと価格を確認。プレビューでは購入／お試しをシミュレートします。"
              : "Pick a plan, review perks & price. Preview simulates purchase / trial."}
          </p>
        </header>

        <div className="grid gap-2.5 sm:grid-cols-3">
          {PRO_SUBSCRIBE_PREVIEW_PLANS.map((plan) => {
            const on = planId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setPlanId(plan.id)}
                className={[
                  "relative rounded-[2px] border px-3 py-3 text-left transition",
                  on
                    ? "border-amber-300/70 bg-amber-300/[0.12] shadow-[inset_0_1px_0_rgba(244,223,154,0.2)]"
                    : "border-white/12 bg-white/[0.03] hover:border-white/22",
                ].join(" ")}
              >
                {(plan.badgeJa || plan.recommended) && (
                  <span
                    className={[
                      nameOxanium.className,
                      "absolute right-2 top-2 rounded-[2px] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em]",
                      plan.recommended || plan.badgeJa === "7日無料"
                        ? "bg-amber-300 text-[#120e08]"
                        : "border border-white/20 bg-black/40 text-white/70",
                    ].join(" ")}
                  >
                    {ja ? plan.badgeJa : plan.badgeEn}
                  </span>
                )}
                <p
                  className={[
                    nameOxanium.className,
                    "text-[10px] font-bold uppercase tracking-[0.16em]",
                    on ? "text-amber-100/90" : "text-white/45",
                  ].join(" ")}
                >
                  {ja ? plan.labelJa : plan.labelEn}
                </p>
                <p
                  className={[
                    nameOxanium.className,
                    "mt-2 text-[22px] font-black tabular-nums leading-none",
                    on ? "text-white" : "text-white/85",
                  ].join(" ")}
                >
                  {ja ? plan.priceJa : plan.priceEn}
                  <span className="ml-1 text-[10px] font-bold tracking-wide text-white/45">
                    {ja ? plan.periodJa : plan.periodEn}
                  </span>
                </p>
                <p className={[jp.className, "mt-2 text-[11px] leading-snug text-white/45"].join(" ")}>
                  {ja ? plan.blurbJa : plan.blurbEn}
                </p>
                {on ? (
                  <span
                    className={[
                      nameOxanium.className,
                      "mt-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-[11px] font-black text-[#120e08]",
                    ].join(" ")}
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <section className="mt-4 border border-white/10 bg-black/25 px-3 py-3">
          <p
            className={[
              nameOxanium.className,
              "mb-2.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-200/75",
            ].join(" ")}
          >
            {ja ? "このプランでできること" : "Included"}
          </p>
          <ul className="space-y-2.5">
            {selected.features.map((f) => (
              <li key={f.titleEn} className="flex items-start gap-2">
                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                <div className="min-w-0">
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
            ))}
          </ul>
        </section>

        {trialAvailable ? (
          <div className="mt-5 space-y-2">
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
            <p className={[jp.className, "text-center text-[11px] leading-relaxed text-white/50"].join(" ")}>
              {afterTrialPriceLine}
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
                ? `お試しなしで${selected.labelJa}を購入`
                : `Buy ${selected.labelEn} (no trial)`}
            </button>
            <p className="text-center text-[10px] leading-relaxed text-white/35">
              {ja
                ? "※ 初回のみ。iOS は App Store のサブスク管理から解約できます。プレビューでは決済しません。"
                : "※ First time only. On iOS, cancel in App Store subscriptions. Preview does not charge."}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
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
                  ? `${selected.labelJa} を購入（プレビュー）`
                  : `Buy ${selected.labelEn} (preview)`}
            </button>
            <p className="text-center text-[10px] leading-relaxed text-white/35">
              {ja
                ? "※ 7日無料は Weekly / Monthly のみ。価格・特典は仮。決済は走りません。"
                : "※ 7-day trial is Weekly / Monthly only. Prices are draft. No real charge."}
            </p>
          </div>
        )}
      </div>

      {trialModalOpen ? (
        <TrialExplainModal
          ja={ja}
          plan={selected}
          onClose={() => setTrialModalOpen(false)}
          onConfirm={confirmTrialFromModal}
        />
      ) : null}
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

function SuccessPanel({
  ja,
  planId,
  planLabel,
  price,
  period,
  trial,
  onAgain,
}: {
  ja: boolean;
  planId: ProSubscribePreviewPlanId;
  planLabel: string;
  price: string;
  period: string;
  trial: boolean;
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
    ? ja
      ? `PRO // 7DAY_TRIAL // ${planLabel.toUpperCase()}`
      : `PRO // 7DAY_TRIAL // ${planLabel.toUpperCase()}`
    : `PRO // ACTIVE // ${planLabel.toUpperCase()}`;

  return (
    <div className="flex w-full flex-col items-center px-1 py-2">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f0cc72] text-[13px] font-black text-[#120e08]">
          ✓
        </span>
        <h2
          className={[
            nameOxanium.className,
            "text-[17px] font-extrabold uppercase tracking-[0.14em] text-white",
          ].join(" ")}
        >
          {title}
        </h2>
      </div>

      {/* Offset gold plate + white tactical frame（参照: 二重枠 + 外側 L ブラケット） */}
      <div className="relative w-full max-w-[22.5rem] pb-[7px] pr-[7px] pt-2 pl-2">
        {/* Outer L brackets — gold, sitting outside the white border */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-20 h-[18px] w-[18px] border-l-[3px] border-t-[3px] border-[#e8f200]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 z-20 h-[18px] w-[18px] border-b-[3px] border-r-[3px] border-[#e8f200]"
        />

        {/* Offset accent plate */}
        <div
          aria-hidden
          className="absolute bottom-0 right-0 top-2 left-2 z-0 bg-[#e8f200]"
        />

        {/* Main white-border card */}
        <div className="relative z-10 border-[2.5px] border-white bg-[#050505]">
          {/* Header strip */}
          <div className="flex items-stretch border-b-[2.5px] border-white bg-white">
            <div className="min-w-0 flex-1 px-3 py-2.5">
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
                {trial ? (ja ? "TRIAL ON" : "TRIAL ON") : "PRO ON"}
              </p>
            </div>
            <div
              className={[
                nameOxanium.className,
                "flex shrink-0 flex-col justify-center border-l-[2.5px] border-black/15 px-2.5 py-2 text-right text-[8px] font-bold uppercase leading-tight tracking-[0.06em] text-black/70",
              ].join(" ")}
            >
              <span>PLAN: {planLabel.toUpperCase()}</span>
              <span className="mt-0.5">
                {trial ? "AUTH: TRIAL" : "AUTH: PAID"}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="relative px-3 pb-3 pt-4">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.22]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(232,242,0,0.55) 0.55px, transparent 0.55px)",
                backgroundSize: "7px 7px",
              }}
            />

            <div className="relative mx-auto flex max-w-[15rem] flex-col items-center gap-2.5 border border-white/20 bg-black/80 px-3 py-5">
              <ProCyberBadge ariaLabel="UNITERZ Pro" compact />
              <p
                className={[
                  nameOxanium.className,
                  "text-[20px] font-semibold tracking-[0.22em] text-white",
                ].join(" ")}
              >
                UNITERZ
              </p>
              <div className="h-px w-14 bg-[#e8f200]" />
              <p
                className={[
                  nameOxanium.className,
                  "text-center text-[10px] font-bold uppercase tracking-[0.1em] text-white/75",
                ].join(" ")}
              >
                {statusLine}
              </p>
              <p
                className={[
                  nameOxanium.className,
                  "text-[12px] font-black tabular-nums tracking-[0.04em] text-[#e8f200]",
                ].join(" ")}
              >
                {trial ? (ja ? "無料 → その後 " : "FREE → THEN ") : ""}
                {price}
                {trial ? period : ""}
              </p>
            </div>

            {/* Meta rows */}
            <div className="relative mt-3 space-y-1.5 border-t border-[#e8f200]/35 pt-3">
              {trial ? (
                <>
                  <MetaRow
                    label={ja ? "START" : "START"}
                    value={started}
                  />
                  <MetaRow
                    label={ja ? "ENDS" : "ENDS"}
                    value={trialEndLabel}
                  />
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
              <button
                type="button"
                className={[
                  nameOxanium.className,
                  "w-full border-2 border-white bg-transparent py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white",
                  "transition hover:bg-white hover:text-black active:scale-[0.99]",
                ].join(" ")}
              >
                {ja ? "Pro データを見る" : "View Pro data"}
              </button>
              <button
                type="button"
                onClick={onAgain}
                className={[
                  nameOxanium.className,
                  "w-full border border-white/35 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55",
                  "transition hover:border-white/60 hover:text-white/85",
                ].join(" ")}
              >
                {ja ? "プラン選択に戻る" : "Back to plans"}
              </button>
            </div>

            <p
              className={[
                nameOxanium.className,
                "relative mt-2.5 text-center text-[8px] font-bold uppercase tracking-[0.12em] text-white/30",
              ].join(" ")}
            >
              SYS_LOG · PREVIEW_MOCK · NO_CHARGE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={[
          nameOxanium.className,
          "shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40",
        ].join(" ")}
      >
        {label}
      </span>
      <span
        className={[
          nameOxanium.className,
          "min-w-0 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#e8f200]",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
