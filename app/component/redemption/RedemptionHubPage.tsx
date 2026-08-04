"use client";

/**
 * 商品交換ハブ: カタログ / 申請一覧 / 申請フォーム入口
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { nameOxanium } from "@/lib/fonts";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { fetchMeRedemptions } from "@/lib/api/fetchMeRedemptions";
import {
  REDEMPTION_DISCLAIMER_EN,
  REDEMPTION_DISCLAIMER_JA,
  REDEMPTION_EXCLUSIONS_EN,
  REDEMPTION_EXCLUSIONS_JA,
} from "@/lib/redemption/redemptionCatalog";
import { redemptionBatchScheduleCopy } from "@/lib/redemption/redemptionBatchScheduleCopy";
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
  const isJa = language === "ja";
  const base = pathBase();
  const batch = redemptionBatchScheduleCopy(isJa ? "ja" : "en");

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
      subtitle={
        isJa
          ? "保有 Unit で NBA 関連商品と交換申請。月末にまとめて購入し配送します。"
          : "Redeem Units for NBA merchandise. We purchase in a monthly batch to reduce shipping."
      }
      contentClassName="max-w-lg space-y-5"
    >
      <div className="rounded-[2px] border border-cyan-300/25 bg-cyan-400/5 px-3 py-3 text-[12px] leading-relaxed text-cyan-50/85">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/80",
          ].join(" ")}
        >
          {batch.short}
        </p>
        <p className="mt-1.5">{batch.detail}</p>
      </div>

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
          {isJa
            ? `今シーズン交換 ${seasonUsed.toLocaleString("ja-JP")} / ${seasonCap.toLocaleString("ja-JP")} Unit`
            : `Season used ${seasonUsed.toLocaleString("en-US")} / ${seasonCap.toLocaleString("en-US")} Units`}
          {!unitsLive
            ? isJa
              ? " · 現在は申請プレビュー（Unit ロックは弁護士確認後）"
              : " · Preview mode (Unit lock after legal review)"
            : null}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`${base}/redeem/apply`}
            className={[
              nameOxanium.className,
              "border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100",
            ].join(" ")}
          >
            {isJa ? "交換申請" : "Apply"}
          </Link>
          <Link
            href={`${base}/units`}
            className={[
              nameOxanium.className,
              "border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70",
            ].join(" ")}
          >
            {isJa ? "Unit 履歴" : "Unit history"}
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
          {isJa ? "カタログ" : "Catalog"}
        </h2>
        <ul className="space-y-2">
          {catalog.map((item) => (
            <li
              key={item.kind}
              className="rounded-[2px] border border-white/10 bg-[rgba(4,9,16,0.97)] px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-white/90">
                    {isJa ? item.titleJa : item.titleEn}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {isJa ? item.blurbJa : item.blurbEn}
                  </p>
                  <p className="mt-1 text-[11px] text-white/40">
                    {isJa
                      ? `価格上限 ${item.priceCapJpy.toLocaleString("ja-JP")} 円`
                      : `Price cap ¥${item.priceCapJpy.toLocaleString("en-US")}`}
                  </p>
                </div>
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
              <Link
                href={`${base}/redeem/apply?kind=${item.kind}`}
                className="mt-2 inline-block text-[11px] font-semibold text-cyan-300/90 underline-offset-2 hover:underline"
              >
                {isJa ? "この区分で申請" : "Apply with this tier"}
              </Link>
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
          {isJa ? "対象外" : "Not eligible"}
        </h2>
        <ul className="list-disc space-y-1 pl-4 text-[12px] text-white/50">
          {(isJa ? REDEMPTION_EXCLUSIONS_JA : REDEMPTION_EXCLUSIONS_EN).map(
            (line) => (
              <li key={line}>{line}</li>
            )
          )}
        </ul>
      </section>

      <section className="space-y-2">
        <h2
          className={[
            nameOxanium.className,
            "text-[11px] font-bold uppercase tracking-[0.16em] text-white/55",
          ].join(" ")}
        >
          {isJa ? "申請一覧" : "Your requests"}
        </h2>
        {loading ? (
          <p className="text-[13px] text-white/45">
            {isJa ? "読み込み中…" : "Loading…"}
          </p>
        ) : error ? (
          <p className="text-[13px] text-rose-300/80">{error}</p>
        ) : requests.length === 0 ? (
          <p className="text-[13px] text-white/45">
            {isJa ? "まだ申請がありません。" : "No requests yet."}
          </p>
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
                      {redemptionStatusLabel(
                        row.status,
                        isJa ? "ja" : "en"
                      )}{" "}
                      · {row.unitsRequired} Unit
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-cyan-300/80">
                    {isJa ? "進捗" : "Track"} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="border border-white/10 bg-black/40 px-3 py-2 text-[11px] leading-relaxed text-white/45">
        {isJa ? REDEMPTION_DISCLAIMER_JA : REDEMPTION_DISCLAIMER_EN}
      </p>
    </ProfileCyberPage>
  );
}
