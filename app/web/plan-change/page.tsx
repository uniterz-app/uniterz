// app/web/plan-change/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { nameOxanium, jp } from "@/lib/fonts";
import {
  PLAN_CTA_SLANT_CLIP,
  PLAN_PANEL_CHAMFER_CLIP,
  PLAN_SECTION_CHAMFER_CLIP,
} from "@/lib/pro/planPanelChrome";
import {
  asProIapPlan,
  changeEffectiveCopy,
  firestoreDate,
  formatPlanDate,
  normalizeStoredPlanType,
  periodEndLabel,
  planCatalogPrice,
  planDisplayNameFull,
  planPeriodLabel,
  suggestedChangeTarget,
  type StoredPlanType,
} from "@/lib/pro/planChangeDisplay";
import type { ProIapPlan } from "@/lib/pro/iapProductIds";

export default function PlanChangePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [storedType, setStoredType] = useState<StoredPlanType | null>(null);
  const [proUntil, setProUntil] = useState<Date | null>(null);
  const [planStart, setPlanStart] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const { language } = useUserLanguage(uid);
  const m = t(language);
  const ja = language !== "en";
  const lang = ja ? "ja" : "en";

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      setUid(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const data = snap.data();
      setPlan(data.plan === "pro" ? "pro" : "free");
      setStoredType(normalizeStoredPlanType(data.planType));
      setProUntil(firestoreDate(data.proUntil));
      setPlanStart(firestoreDate(data.planStartDate));
      setLoading(false);
    };

    void fetchUser();
  }, []);

  const currentPlan: ProIapPlan = asProIapPlan(storedType);
  const nextPlan = suggestedChangeTarget(currentPlan);
  const copy = useMemo(() => {
    if (!nextPlan) return null;
    return changeEffectiveCopy({
      from: currentPlan,
      to: nextPlan,
      periodEnd: proUntil,
      lang,
    });
  }, [currentPlan, nextPlan, proUntil, lang]);

  const openPortal = async () => {
    setPortalError(null);
    setPortalBusy(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setPortalError(ja ? "ログインが必要です" : "Please sign in");
        return;
      }

      const idToken = await user.getIdToken();
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          returnUrl: "/web/plan-change-complete",
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!res.ok || !data?.url) {
        setPortalError(
          ja
            ? "課金管理画面を開けませんでした。Stripe 顧客が未登録の可能性があります。"
            : "Could not open billing portal. Stripe customer may be missing."
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      setPortalError(
        ja ? "通信エラーが発生しました" : "A network error occurred"
      );
    } finally {
      setPortalBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <CandleChartLoader label={m.common.loading} />
      </div>
    );
  }

  const panelClass = [
    "relative w-full overflow-hidden border border-amber-300/35",
    "bg-[linear-gradient(165deg,rgba(18,16,12,0.96)_0%,rgba(8,10,16,0.98)_55%,rgba(5,8,14,0.99)_100%)]",
    "px-4 pb-6 pt-2 sm:px-5 sm:pb-7 sm:pt-3",
    "shadow-[0_20px_52px_rgba(0,0,0,0.55),0_0_28px_rgba(212,175,90,0.1)]",
  ].join(" ");
  const panelStyle = {
    clipPath: PLAN_PANEL_CHAMFER_CLIP,
    WebkitClipPath: PLAN_PANEL_CHAMFER_CLIP,
  } as const;
  const sectionStyle = {
    clipPath: PLAN_SECTION_CHAMFER_CLIP,
    WebkitClipPath: PLAN_SECTION_CHAMFER_CLIP,
  } as const;
  const ctaStyle = {
    clipPath: PLAN_CTA_SLANT_CLIP,
    WebkitClipPath: PLAN_CTA_SLANT_CLIP,
  } as const;

  if (plan !== "pro") {
    return (
      <ProfileCyberPage
        title="CHANGE"
        subtitle={
          ja
            ? "プランの変更手続きを行います。"
            : "Manage your subscription plan."
        }
        contentClassName="max-w-md px-4 pb-bottom-nav pt-2"
      >
        <div className={panelClass} style={panelStyle}>
          <p className={[jp.className, "text-center text-sm text-white/70"].join(" ")}>
            {ja
              ? "Pro プラン加入後に変更できます。"
              : "Available after you join Pro."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/web/pro/subscribe")}
            className={[
              nameOxanium.className,
              "mt-6 w-full py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em]",
              "bg-amber-300 text-[#120e08] transition hover:brightness-110 active:scale-[0.99]",
            ].join(" ")}
            style={ctaStyle}
          >
            {m.settings.upgradeToPro}
          </button>
        </div>
      </ProfileCyberPage>
    );
  }

  return (
    <ProfileCyberPage
      title="CHANGE"
      subtitle={
        ja
          ? "プランの変更手続きを行います。"
          : "Manage your subscription plan."
      }
      contentClassName="max-w-md px-4 pb-bottom-nav pt-2"
    >
      <div className={panelClass} style={panelStyle}>
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="-mb-8 -mt-6 w-[220px]">
            <UniterzLogo width="100%" />
          </div>
          <ProCyberBadge ariaLabel="UNITERZ Pro" premium />
          <h1
            className={[
              nameOxanium.className,
              "mt-4 text-[22px] font-extrabold uppercase tracking-[0.14em] text-white",
            ].join(" ")}
          >
            {m.settings.changePlan}
          </h1>
          {planStart ? (
            <p className={[jp.className, "mt-2 text-[11px] text-white/45"].join(" ")}>
              {ja ? "開始日" : "Started"}: {formatPlanDate(planStart, lang)}
            </p>
          ) : null}
        </div>

        <section
          className="mb-3 border border-white/15 bg-white/[0.03] px-3.5 py-3.5"
          style={sectionStyle}
        >
          <div
            className={[
              nameOxanium.className,
              "text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/45",
            ].join(" ")}
          >
            {ja ? "現在のプラン" : "Current plan"}
          </div>
          <div
            className={[
              nameOxanium.className,
              "mt-1 text-[22px] font-black uppercase tracking-[0.06em]",
              currentPlan === "weekly"
                ? "text-cyan-300"
                : currentPlan === "season"
                  ? "text-amber-300"
                  : "text-blue-300",
            ].join(" ")}
          >
            {planDisplayNameFull(storedType ?? currentPlan, lang)}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={[
                nameOxanium.className,
                "text-[20px] font-black tabular-nums text-white",
              ].join(" ")}
            >
              {planCatalogPrice(currentPlan, lang)}
            </span>
            <span
              className={[
                nameOxanium.className,
                "text-[10px] font-bold text-white/45",
              ].join(" ")}
            >
              {planPeriodLabel(currentPlan, lang)}
              {ja ? "・税込み" : " · tax incl."}
            </span>
          </div>
          <p className={[jp.className, "mt-2.5 text-[13px] text-white/65"].join(" ")}>
            {periodEndLabel(currentPlan, lang)}:{" "}
            <span className="font-semibold text-white/90">
              {formatPlanDate(proUntil, lang)}
            </span>
          </p>
        </section>

        {nextPlan && copy ? (
          <>
            <section
              className="mb-3 border border-amber-300/35 bg-amber-300/[0.05] px-3.5 py-3.5"
              style={sectionStyle}
            >
              <div
                className={[
                  nameOxanium.className,
                  "text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-200/70",
                ].join(" ")}
              >
                {ja ? "変更後のプラン" : "New plan"}
              </div>
              <div
                className={[
                  nameOxanium.className,
                  "mt-1 text-[20px] font-black uppercase tracking-[0.06em] text-white",
                ].join(" ")}
              >
                {planDisplayNameFull(nextPlan, lang)}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span
                  className={[
                    nameOxanium.className,
                    "text-[22px] font-black tabular-nums text-white",
                  ].join(" ")}
                >
                  {planCatalogPrice(nextPlan, lang)}
                </span>
                <span
                  className={[
                    nameOxanium.className,
                    "text-[10px] font-bold text-white/45",
                  ].join(" ")}
                >
                  {planPeriodLabel(nextPlan, lang)}
                  {ja ? "・税込み" : " · tax incl."}
                </span>
              </div>
              <p
                className={[
                  nameOxanium.className,
                  "mt-3 text-[12px] font-bold text-white/85",
                ].join(" ")}
              >
                {copy.nextChargeLabel}
              </p>
              <p className={[jp.className, "mt-2 text-[12px] leading-relaxed text-white/55"].join(" ")}>
                <span className="font-semibold text-white/75">
                  {copy.timingLabel}:{" "}
                </span>
                {copy.timingDetail}
              </p>
            </section>

            <p className={[jp.className, "mb-4 text-center text-[11px] text-white/50"].join(" ")}>
              {ja
                ? "実際の変更内容・請求日は次の課金画面で確認できます"
                : "Confirm the exact change and billing date on the next screen"}
            </p>

            <button
              type="button"
              disabled={portalBusy}
              onClick={() => void openPortal()}
              className={[
                nameOxanium.className,
                "mb-4 w-full py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em] transition",
                portalBusy
                  ? "cursor-wait bg-white/10 text-white/50"
                  : "bg-amber-300 text-[#120e08] hover:brightness-110 active:scale-[0.99]",
              ].join(" ")}
              style={ctaStyle}
            >
              {portalBusy
                ? ja
                  ? "開いています…"
                  : "Opening…"
                : ja
                  ? `${planDisplayNameFull(nextPlan, "ja")} へ変更`
                  : `Switch to ${planDisplayNameFull(nextPlan, "en")}`}
            </button>

            {portalError ? (
              <p className={[jp.className, "mb-4 text-center text-xs text-red-300"].join(" ")}>
                {portalError}
              </p>
            ) : null}
          </>
        ) : (
          <section
            className="mb-4 border border-white/15 bg-white/[0.03] px-3.5 py-3.5"
            style={sectionStyle}
          >
            <p className={[jp.className, "text-[13px] leading-relaxed text-white/65"].join(" ")}>
              {ja
                ? "Season Pass は買い切りのため、Weekly / Monthly への自動切替はありません。期間終了後に改めて購入してください。"
                : "Season Pass is one-time. It does not auto-switch to Weekly / Monthly. Purchase again after it ends."}
            </p>
          </section>
        )}

        <div className={[jp.className, "space-y-1 text-center text-[11px] text-white/50"].join(" ")}>
          <p>
            {ja
              ? "※ Weekly / Monthly は自動更新されます。"
              : "※ Weekly / Monthly renew automatically."}
          </p>
          <p>
            {ja
              ? "※ ダウングレードは現在の契約期間終了後に適用されます。"
              : "※ Downgrades apply after the current period ends."}
          </p>
          <p>
            {ja
              ? "※ 変更までの期間は現在のプランをご利用いただけます。"
              : "※ Keep current plan benefits until the change takes effect."}
          </p>
          <p>
            {ja
              ? "※ ダウングレード時の返金はありません。"
              : "※ No refunds on downgrade."}
          </p>
        </div>
      </div>
    </ProfileCyberPage>
  );
}
