// app/web/pro/success/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { motion, useReducedMotion } from "framer-motion";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import { nameOxanium } from "@/lib/fonts";
import { PRO_SUCCESS_ACCENT } from "@/lib/pro/proSuccessAccent";
import { PRO_SUBSCRIBE_SUCCESS_MOTION as SM } from "@/lib/pro/proSubscribeSuccessMotion";
import {
  asProIapPlan,
  firestoreDate,
  formatPlanDate,
  normalizeStoredPlanType,
  planCatalogPrice,
  planDisplayNameFull,
  planPeriodLabel,
  type StoredPlanType,
} from "@/lib/pro/planChangeDisplay";
import type { ProIapPlan } from "@/lib/pro/iapProductIds";

/** 本番課金成功 — サイバー HUD / グリーンアクセント */
const A = PRO_SUCCESS_ACCENT.billing;

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={[
          nameOxanium.className,
          "shrink-0 text-[9px] font-bold uppercase tracking-[0.14em]",
        ].join(" ")}
        style={{ color: A.metaLabel }}
      >
        {label}
      </span>
      <span
        className={[
          nameOxanium.className,
          "min-w-0 text-right text-[11px] font-bold uppercase tracking-[0.04em]",
        ].join(" ")}
        style={{ color: A.main }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ProSuccessPage() {
  const router = useRouter();
  const [storedType, setStoredType] = useState<StoredPlanType | null>(null);
  const [proUntil, setProUntil] = useState<Date | null>(null);
  const [profileHref, setProfileHref] = useState("/mobile");

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    void (async () => {
      const data = await getUserDocDataCached(user.uid);
      if (!data) return;
      setStoredType(normalizeStoredPlanType(data.planType));
      setProUntil(firestoreDate(data.proUntil));
      const handle =
        typeof data.handle === "string" && data.handle.trim()
          ? data.handle.trim()
          : user.uid;
      setProfileHref(`/web/u/${encodeURIComponent(handle)}`);
    })();
  }, []);

  const plan: ProIapPlan = asProIapPlan(storedType);
  const planLabel = planDisplayNameFull(storedType ?? plan, "en");
  const price = planCatalogPrice(plan, "ja");
  const period = planPeriodLabel(plan, "ja");
  const untilLabel = formatPlanDate(proUntil, "ja");
  const started = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const reduceMotion = useReducedMotion();
  const motionOn = reduceMotion !== true;
  const easeOut = [0.22, 0.61, 0.36, 1] as const;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app px-4 text-center">
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
          <h1
            className={[
              nameOxanium.className,
              "text-[17px] font-extrabold uppercase tracking-[0.14em]",
            ].join(" ")}
            style={{ color: A.title }}
          >
            Upgrade to Pro!
          </h1>
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
              <div className="relative z-[1] min-w-0 flex-1 px-3 py-2.5 text-left">
                <p
                  className={[
                    nameOxanium.className,
                    "text-[8px] font-bold uppercase tracking-[0.16em] text-black/55",
                  ].join(" ")}
                >
                  UPGRADE_CONFIRMED // TYPE: PRO
                </p>
                <p
                  className={[
                    nameOxanium.className,
                    "mt-0.5 text-[18px] font-black uppercase leading-none tracking-[0.08em] text-black",
                  ].join(" ")}
                >
                  PRO ON
                </p>
              </div>
              <div
                className={[
                  nameOxanium.className,
                  "relative z-[1] flex shrink-0 flex-col justify-center border-l-[2.5px] border-black/15 px-2.5 py-2 text-right text-[8px] font-bold uppercase leading-tight tracking-[0.06em] text-black/70",
                ].join(" ")}
              >
                <span>PLAN: {planLabel.toUpperCase()}</span>
                <span className="mt-0.5">AUTH: PAID</span>
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
                className="relative mx-auto flex max-w-[15rem] flex-col items-center gap-2.5 bg-[rgba(4,10,18,0.88)] px-3 py-5"
                style={{
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: A.borderSoft,
                }}
              >
                <ProCyberBadge ariaLabel="UNITERZ Pro" premium />
                <p
                  className={[
                    nameOxanium.className,
                    "text-[20px] font-semibold tracking-[0.22em]",
                  ].join(" ")}
                  style={{ color: A.title }}
                >
                  UNITERZ
                </p>
                <div
                  className="h-px w-14"
                  style={{ backgroundColor: A.main }}
                />
                <p
                  className={[
                    nameOxanium.className,
                    "text-center text-[10px] font-bold uppercase tracking-[0.1em]",
                  ].join(" ")}
                  style={{ color: A.muted }}
                >
                  {`ACTIVE // ${planLabel.toUpperCase()}`}
                </p>
                <p
                  className={[
                    nameOxanium.className,
                    "text-[12px] font-black tabular-nums tracking-[0.04em]",
                  ].join(" ")}
                  style={{ color: A.main }}
                >
                  {price}
                  <span
                    className="ml-1 text-[10px] font-bold tracking-[0.06em]"
                    style={{ color: A.soft }}
                  >
                    {period}・税込み
                  </span>
                </p>
              </div>

              <div
                className="relative mt-3 space-y-1.5 border-t pt-3"
                style={{ borderColor: A.borderSoft }}
              >
                <MetaRow label="START" value={started} />
                <MetaRow label="RENEW" value={untilLabel} />
              </div>

              <div className="relative mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => router.push(profileHref)}
                  className={[
                    nameOxanium.className,
                    "flex w-full items-center justify-center py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] transition hover:brightness-110 active:scale-[0.99]",
                  ].join(" ")}
                  style={{
                    backgroundColor: A.main,
                    color: A.ink,
                    boxShadow: `0 0 16px rgba(${A.mainRgb},0.28)`,
                  }}
                >
                  Proデータを見る
                </button>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Link
                    href="/web/terms"
                    className={[
                      nameOxanium.className,
                      "text-[9px] font-bold uppercase tracking-[0.12em]",
                    ].join(" ")}
                    style={{ color: A.soft }}
                  >
                    利用規約
                  </Link>
                  <span
                    className="text-[9px]"
                    style={{ color: `rgba(${A.mainRgb},0.3)` }}
                  >
                    |
                  </span>
                  <Link
                    href="/web/contact"
                    className={[
                      nameOxanium.className,
                      "text-[9px] font-bold uppercase tracking-[0.12em]",
                    ].join(" ")}
                    style={{ color: A.soft }}
                  >
                    お問い合わせ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
