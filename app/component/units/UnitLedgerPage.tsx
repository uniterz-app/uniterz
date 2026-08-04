"use client";

/**
 * Unit 獲得・使用履歴（users.unitBalance の台帳 unit_ledger）
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { nameOxanium } from "@/lib/fonts";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { fetchMeUnitLedger } from "@/lib/api/fetchMeUnitLedger";
import {
  formatUnitLedgerAmount,
  formatUnitLedgerDate,
} from "@/lib/units/formatUnitLedgerEntry";
import type { UnitLedgerEntry } from "@/lib/units/unitLedgerTypes";

export default function UnitLedgerPage() {
  const pathname = usePathname();
  const redeemHref = pathname?.startsWith("/web") ? "/web/redeem" : "/mobile/redeem";
  const { fUser: user, status } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isJa = language === "ja";
  const gateLang = isJa ? "ja" : "en";

  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<UnitLedgerEntry[]>([]);
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
      const data = await fetchMeUnitLedger(gateLang);
      setBalance(data.balance ?? 0);
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [status, user, gateLang]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ProfileCyberPage
      title="UNIT HISTORY"
      eyebrow="UNIT LEDGER"
      subtitle={
        isJa
          ? "獲得・使用の記録。招待やバトル報酬などがここに並びます。"
          : "Earn and spend history — invites, battles, and more."
      }
    >
      <div className="mb-5 rounded-[2px] border border-amber-300/25 bg-[rgba(8,10,14,0.92)] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
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
                "mt-1 text-[22px] font-extrabold italic tracking-wide text-white",
              ].join(" ")}
            >
              {balance.toLocaleString("en-US")}
              <span className="ml-1.5 text-[11px] font-bold not-italic tracking-[0.12em] text-amber-200/80">
                UNIT
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className={[
              nameOxanium.className,
              "border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:border-cyan-300/40 hover:text-cyan-100",
            ].join(" ")}
          >
            {isJa ? "更新" : "Refresh"}
          </button>
        </div>
        <Link
          href={redeemHref}
          className={[
            nameOxanium.className,
            "mt-3 inline-flex border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100",
          ].join(" ")}
        >
          {isJa ? "商品交換" : "Redeem"}
        </Link>
      </div>

      {loading ? (
        <p className="py-10 text-center text-[13px] text-white/45">
          {isJa ? "読み込み中…" : "Loading…"}
        </p>
      ) : error ? (
        <p className="py-10 text-center text-[13px] text-rose-300/80">{error}</p>
      ) : entries.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-white/45">
          {isJa
            ? "まだ履歴がありません。招待達成などで Unit が付与されるとここに表示されます。"
            : "No history yet. Entries appear when you earn Units (e.g. referrals)."}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-[2px] border border-white/10 bg-[rgba(4,9,16,0.97)]">
          {entries.map((row, index) => {
            const positive = row.amount > 0;
            const negative = row.amount < 0;
            return (
              <li
                key={row.id}
                className={[
                  "flex items-start gap-3 px-3 py-3",
                  index < entries.length - 1 ? "border-b border-white/8" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    nameOxanium.className,
                    "w-10 shrink-0 pt-0.5 text-[11px] font-bold tabular-nums text-white/40",
                  ].join(" ")}
                >
                  {formatUnitLedgerDate(row.createdAtMs, gateLang)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-white/90">
                    {row.title}
                  </p>
                  {row.detail ? (
                    <p className="mt-0.5 truncate text-[11px] text-white/45">
                      {row.detail}
                    </p>
                  ) : null}
                </div>
                <span
                  className={[
                    nameOxanium.className,
                    "shrink-0 text-[14px] font-extrabold tabular-nums",
                    positive
                      ? "text-emerald-300"
                      : negative
                        ? "text-rose-300"
                        : "text-white/70",
                  ].join(" ")}
                >
                  {formatUnitLedgerAmount(row.amount, gateLang)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ProfileCyberPage>
  );
}
