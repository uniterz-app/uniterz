// app/mobile/plan-status/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { DATE_LOCALE } from "@/lib/i18n/language";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import { nameOxanium, jp } from "@/lib/fonts";
import {
  PLAN_CTA_SLANT_CLIP,
  PLAN_PANEL_CHAMFER_CLIP,
} from "@/lib/pro/planPanelChrome";
import {
  asProIapPlan,
  firestoreDate,
  formatProTenureLabel,
  normalizeStoredPlanType,
  periodEndLabel,
  planCatalogPrice,
  planDisplayNameFull,
  planPeriodLabel,
  type StoredPlanType,
} from "@/lib/pro/planChangeDisplay";

type PlanType = StoredPlanType | null;

export default function PlanStatusPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [planType, setPlanType] = useState<PlanType>(null);
  const [proUntil, setProUntil] = useState<Date | null>(null);
  const [planStart, setPlanStart] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const { language } = useUserLanguage(uid);
  const m = t(language);
  const ja = language !== "en";
  const lang = ja ? "ja" : "en";

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString(DATE_LOCALE[language]) : null;

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      setUid(user.uid);

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const data = snap.data();

      setPlan(data.plan === "pro" ? "pro" : "free");
      setPlanType(normalizeStoredPlanType(data.planType));
      setProUntil(firestoreDate(data.proUntil));
      setPlanStart(firestoreDate(data.planStartDate));
      setLoading(false);
    };

    void fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <CandleChartLoader label={m.common.loading} />
      </div>
    );
  }

  const currentIap = asProIapPlan(planType);
  const planLabel =
    plan === "free"
      ? m.settings.freePlan
      : planDisplayNameFull(planType ?? currentIap, lang);

  return (
    <ProfileCyberPage
      title="PLAN"
      subtitle={
        ja
          ? "現在のプランと更新情報を確認できます。"
          : "Check your current plan and renewal details."
      }
      contentClassName="mx-auto flex min-h-[calc(100dvh-7.5rem)] max-w-md flex-col justify-center px-4 pb-bottom-nav pt-2"
    >
      <div
        className={[
          "relative w-full overflow-hidden border border-amber-300/35",
          "bg-[linear-gradient(165deg,rgba(18,16,12,0.96)_0%,rgba(8,10,16,0.98)_55%,rgba(5,8,14,0.99)_100%)]",
          "px-4 pb-6 pt-6 sm:px-5 sm:pb-7 sm:pt-7",
          "shadow-[0_20px_52px_rgba(0,0,0,0.55),0_0_28px_rgba(212,175,90,0.1)]",
        ].join(" ")}
        style={{
          clipPath: PLAN_PANEL_CHAMFER_CLIP,
          WebkitClipPath: PLAN_PANEL_CHAMFER_CLIP,
        }}
      >
        <div className="mb-3 flex flex-col items-center text-center">
          <div className="mb-2 w-[200px]">
            <UniterzLogo width="100%" />
          </div>
          {plan === "pro" ? (
            <ProCyberBadge ariaLabel="UNITERZ Pro" premium />
          ) : (
            <div
              className={[
                nameOxanium.className,
                "flex h-14 w-14 items-center justify-center border border-cyan-300/35 bg-cyan-300/10 text-[28px] font-black italic text-cyan-100",
              ].join(" ")}
              style={{
                clipPath: PLAN_PANEL_CHAMFER_CLIP,
                WebkitClipPath: PLAN_PANEL_CHAMFER_CLIP,
              }}
              aria-hidden
            >
              U
            </div>
          )}
        </div>

        <div className="text-center">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200/70",
            ].join(" ")}
          >
            {plan === "pro" ? "PRO PLAN" : "FREE PLAN"}
          </p>
          <h2
            className={[
              nameOxanium.className,
              "mt-1.5 text-[26px] font-black uppercase tracking-[0.08em] text-white",
            ].join(" ")}
          >
            {planLabel}
          </h2>

          {plan === "pro" && formatProTenureLabel(planStart, lang) ? (
            <p
              className={[
                nameOxanium.className,
                "mt-2 text-[13px] font-extrabold tracking-[0.06em] text-amber-200/90",
              ].join(" ")}
            >
              {formatProTenureLabel(planStart, lang)}
            </p>
          ) : null}

          {plan === "pro" ? (
            <div className="mt-3 flex items-baseline justify-center gap-1.5">
              <span
                className={[
                  nameOxanium.className,
                  "text-[22px] font-black tabular-nums text-white",
                ].join(" ")}
              >
                {planCatalogPrice(currentIap, lang)}
              </span>
              <span
                className={[
                  nameOxanium.className,
                  "text-[10px] font-bold tracking-wide text-white/45",
                ].join(" ")}
              >
                {planPeriodLabel(currentIap, lang)}
                {ja ? "・税込み" : " · tax incl."}
              </span>
            </div>
          ) : null}

          <div className="mt-3 space-y-1">
            {plan === "pro" && planStart ? (
              <p className={[jp.className, "text-[12px] text-white/55"].join(" ")}>
                {ja ? "開始日" : "Started"}:{" "}
                <span className="font-semibold text-white/80">
                  {formatDate(planStart)}
                </span>
              </p>
            ) : null}
            <p className={[jp.className, "text-[13px] text-white/65"].join(" ")}>
              {periodEndLabel(currentIap, lang)}:{" "}
              <span className="font-semibold text-white/90">
                {plan === "pro" && proUntil ? formatDate(proUntil) : "-----"}
              </span>
            </p>
          </div>
        </div>

        <div className="my-6 border-t border-white/10" />

        {plan === "free" ? (
          <button
            type="button"
            onClick={() => router.push("/mobile/pro/subscribe")}
            className={[
              nameOxanium.className,
              "w-full py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em]",
              "bg-amber-300 text-[#120e08] transition hover:brightness-110 active:scale-[0.99]",
            ].join(" ")}
            style={{
              clipPath: PLAN_CTA_SLANT_CLIP,
              WebkitClipPath: PLAN_CTA_SLANT_CLIP,
            }}
          >
            {m.settings.upgradeToPro}
          </button>
        ) : (
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/mobile/plan-change")}
              className={[
                nameOxanium.className,
                "w-full py-3.5 text-[13px] font-extrabold uppercase tracking-[0.12em]",
                "bg-amber-300 text-[#120e08] transition hover:brightness-110 active:scale-[0.99]",
              ].join(" ")}
              style={{
                clipPath: PLAN_CTA_SLANT_CLIP,
                WebkitClipPath: PLAN_CTA_SLANT_CLIP,
              }}
            >
              {m.settings.changePlan}
            </button>
            <button
              type="button"
              onClick={() => router.push("/mobile/cancel-plan")}
              className={[
                nameOxanium.className,
                "w-full border border-red-400/45 bg-transparent py-3.5 text-[12px] font-extrabold uppercase tracking-[0.14em]",
                "text-red-300 transition hover:bg-red-400/10 active:scale-[0.99]",
              ].join(" ")}
              style={{
                clipPath: PLAN_CTA_SLANT_CLIP,
                WebkitClipPath: PLAN_CTA_SLANT_CLIP,
              }}
            >
              {m.settings.cancelPlan}
            </button>
          </div>
        )}
      </div>
    </ProfileCyberPage>
  );
}
