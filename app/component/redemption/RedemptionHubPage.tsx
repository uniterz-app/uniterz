"use client";

/**
 * 商品交換ハブ: カタログ / 申請一覧 / 申請フォーム入口
 */
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { nameOxanium } from "@/lib/fonts";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import { fetchMeRedemptions } from "@/lib/api/fetchMeRedemptions";
import {
  redemptionCatalogBlurb,
  redemptionCatalogTitle,
  redemptionDisclaimerCopy,
  redemptionExclusionsCopy,
  redemptionPriceCapLabel,
} from "@/lib/redemption/redemptionCatalog";
import { redemptionCatalogImageSrc } from "@/lib/redemption/redemptionCatalogImages";
import { redemptionHubUiCopy } from "@/lib/redemption/redemptionUiCopy";
import { redemptionStatusLabel } from "@/lib/redemption/redemptionStatus";
import type {
  RedemptionCatalogItem,
  RedemptionRequest,
} from "@/lib/redemption/redemptionTypes";

function pathBase() {
  if (typeof window === "undefined") return "/mobile";
  return window.location.pathname.startsWith("/web") ? "/web" : "/mobile";
}

export default function RedemptionHubPage() {
  const { fUser: user, status } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const lang = resolveLocalizedLang(language);
  const ui = redemptionHubUiCopy(lang);
  const base = pathBase();

  const [balance, setBalance] = useState(0);
  const [seasonUsed, setSeasonUsed] = useState(0);
  const [seasonCap, setSeasonCap] = useState(2000);
  const [unitsLive, setUnitsLive] = useState(false);
  const [catalog, setCatalog] = useState<RedemptionCatalogItem[]>([]);
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (status !== "ready" || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMeRedemptions();
      setBalance(data.balance ?? 0);
      setSeasonUsed(data.seasonUnitsUsed ?? 0);
      setSeasonCap(data.seasonCap ?? 2000);
      setUnitsLive(data.unitsLive === true);
      setCatalog(Array.isArray(data.catalog) ? [...data.catalog] : []);
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, [status, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ProfileCyberPage
      title="REDEEM"
      eyebrow="UNIT EXCHANGE"
      subtitle={ui.subtitle}
      contentClassName="max-w-lg space-y-5"
    >
      <div className="rounded-[2px] border border-amber-300/25 bg-[rgba(8,10,14,0.92)] px-3 py-3">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/70",
          ].join(" ")}
        >
          Balance
        </p>
        <p
          className={[
            nameOxanium.className,
            "mt-1 text-[22px] font-extrabold italic text-white",
          ].join(" ")}
        >
          {balance.toLocaleString("en-US")}
          <span className="ml-1.5 text-[11px] font-bold not-italic tracking-[0.12em] text-amber-200/80">
            UNIT
          </span>
        </p>
        <p className="mt-2 text-[11px] text-white/50">
          {ui.seasonLine(seasonUsed, seasonCap)}
          {!unitsLive ? ui.previewNote : null}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`${base}/redeem/apply`}
            className={[
              nameOxanium.className,
              "border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100",
            ].join(" ")}
          >
            {ui.apply}
          </Link>
          <Link
            href={`${base}/units`}
            className={[
              nameOxanium.className,
              "border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70",
            ].join(" ")}
          >
            {ui.history}
          </Link>
        </div>
      </div>

      <section className="space-y-2">
        <h2
          className={[
            nameOxanium.className,
            "text-[11px] font-bold uppercase tracking-[0.16em] text-white/55",
          ].join(" ")}
        >
          {ui.catalog}
        </h2>
        <ul className="space-y-2">
          {catalog.map((item) => (
            <li
              key={item.kind}
              className="rounded-[2px] border border-white/10 bg-[rgba(4,9,16,0.97)] px-3 py-3"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden bg-black">
                  <Image
                    src={redemptionCatalogImageSrc(item.kind)}
                    alt=""
                    width={72}
                    height={72}
                    className="h-full w-full object-cover"
                    sizes="72px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold text-white/90">
                      {redemptionCatalogTitle(item, lang)}
                    </p>
                    <p
                      className={[
                        nameOxanium.className,
                        "shrink-0 text-[16px] font-extrabold text-amber-200",
                      ].join(" ")}
                    >
                      {item.unitsRequired}
                      <span className="ml-1 text-[10px] font-bold tracking-wide text-amber-200/70">
                        U
                      </span>
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {redemptionCatalogBlurb(item, lang)}
                  </p>
                  <p className="mt-1 text-[11px] text-white/40">
                    {redemptionPriceCapLabel(item, lang)}
                  </p>
                  <Link
                    href={`${base}/redeem/apply?kind=${item.kind}`}
                    className="mt-2 inline-block text-[11px] font-semibold text-cyan-300/90 underline-offset-2 hover:underline"
                  >
                    {ui.applyWithTier}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2
          className={[
            nameOxanium.className,
            "text-[11px] font-bold uppercase tracking-[0.16em] text-white/55",
          ].join(" ")}
        >
          {ui.notEligible}
        </h2>
        <ul className="list-disc space-y-1 pl-4 text-[12px] text-white/50">
          {redemptionExclusionsCopy(lang).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2
          className={[
            nameOxanium.className,
            "text-[11px] font-bold uppercase tracking-[0.16em] text-white/55",
          ].join(" ")}
        >
          {ui.requests}
        </h2>
        {loading ? (
          <p className="text-[13px] text-white/45">{ui.loading}</p>
        ) : error ? (
          <p className="text-[13px] text-rose-300/80">{error}</p>
        ) : requests.length === 0 ? (
          <p className="text-[13px] text-white/45">{ui.noRequests}</p>
        ) : (
          <ul className="overflow-hidden rounded-[2px] border border-white/10 bg-[rgba(4,9,16,0.97)]">
            {requests.map((row, index) => (
              <li
                key={row.id}
                className={[
                  "px-3 py-3",
                  index < requests.length - 1 ? "border-b border-white/8" : "",
                ].join(" ")}
              >
                <Link
                  href={`${base}/redeem/${row.id}`}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white/90">
                      {row.productName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/45">
                      {redemptionStatusLabel(row.status, lang)} ·{" "}
                      {row.unitsRequired} Unit
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-cyan-300/80">
                    {ui.track} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="border border-white/10 bg-black/40 px-3 py-2 text-[11px] leading-relaxed text-white/45">
        {redemptionDisclaimerCopy(lang)}
      </p>
    </ProfileCyberPage>
  );
}
