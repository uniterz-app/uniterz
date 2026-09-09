// app/mobile/plan-change/page.tsx
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
import {
  planChangeConfirmHint,
  planChangeCurrentLabel,
  planChangeFreeGateBody,
  planChangeNextLabel,
  planChangeNotices,
  planChangeOpeningLabel,
  planChangePortalNetworkError,
  planChangePortalOpenFailed,
  planChangePortalSignInRequired,
  planChangePageSubtitle,
  planChangeSeasonPassNote,
  planChangeScreenTitle,
  planChangeStartedLabel,
  planChangeSwitchCta,
  planChangeTaxSuffix,
  planChangeUpgradeCta,
  type PlanChangeUiLang,
} from "@/lib/pro/planChangeUiCopy";

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
  const lang: PlanChangeUiLang = language === "en" ? "en" : "ja";
  const notices = planChangeNotices(lang);

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
        setPortalError(planChangePortalSignInRequired(lang));
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
          returnUrl: "/mobile/plan-change-complete",
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!res.ok || !data?.url) {
        setPortalError(planChangePortalOpenFailed(lang));
        return;
      }
      window.location.href = data.url;
    } catch {
      setPortalError(planChangePortalNetworkError(lang));
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
    "px-4 pb-6 pt-6 sm:px-5 sm:pb-7 sm:pt-7",
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
        subtitle={planChangePageSubtitle(lang)}
        contentClassName="max-w-md px-4 pb-bottom-nav pt-2"
      >
        <div className={panelClass} style={panelStyle}>
          <p className={[jp.className, "text-center text-sm text-white/70"].join(" ")}>
            {planChangeFreeGateBody(lang)}
          </p>
          <button
            type="button"
            onClick={() => router.push("/mobile/pro/subscribe")}
            className={[
              nameOxanium.className,
              "mt-6 w-full py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em]",
              "bg-amber-300 text-[#120e08] transition hover:brightness-110 active:scale-[0.99]",
            ].join(" ")}
            style={ctaStyle}
          >
            {planChangeUpgradeCta(lang)}
          </button>
        </div>
      </ProfileCyberPage>
    );
  }

  return (
    <ProfileCyberPage
      title="CHANGE"
      subtitle={planChangePageSubtitle(lang)}
      contentClassName="max-w-md px-4 pb-bottom-nav pt-2"
    >
      <div className={panelClass} style={panelStyle}>
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-2 w-[220px]">
            <UniterzLogo width="100%" />
          </div>
          <ProCyberBadge ariaLabel="UNITERZ Pro" premium />
          <h1
            className={[
              nameOxanium.className,
              "mt-4 text-[22px] font-extrabold uppercase tracking-[0.14em] text-white",
            ].join(" ")}
          >
            {planChangeScreenTitle(lang)}
          </h1>
          {planStart ? (
            <p className={[jp.className, "mt-2 text-[11px] text-white/45"].join(" ")}>
              {planChangeStartedLabel(lang)}: {formatPlanDate(planStart, lang)}
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
            {planChangeCurrentLabel(lang)}
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
              {planChangeTaxSuffix(lang)}
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
                {planChangeNextLabel(lang)}
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
                  {planChangeTaxSuffix(lang)}
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
{planChangeConfirmHint(lang, "web")}
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
                ? planChangeOpeningLabel(lang)
                : planChangeSwitchCta(
                    lang,
                    planDisplayNameFull(nextPlan, lang),
                    "web"
                  )}
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
              {planChangeSeasonPassNote(lang)}
            </p>
          </section>
        )}

        <div className={[jp.className, "space-y-1 text-center text-[11px] text-white/50"].join(" ")}>
          {notices.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </ProfileCyberPage>
  );
}
