"use client";

/**
 * 交換申請の進捗タイムライン
 */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { nameOxanium } from "@/lib/fonts";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  cancelMeRedemption,
  fetchMeRedemption,
  submitMeRedemptionDraft,
} from "@/lib/api/fetchMeRedemptions";
import {
  REDEMPTION_PROGRESS_STEPS,
  canUserCancelRedemption,
  progressStepIndex,
  redemptionStatusLabel,
} from "@/lib/redemption/redemptionStatus";
import { redemptionBatchScheduleCopy } from "@/lib/redemption/redemptionBatchScheduleCopy";
import type { RedemptionRequest } from "@/lib/redemption/redemptionTypes";

function pathBase() {
  if (typeof window === "undefined") return "/mobile";
  return window.location.pathname.startsWith("/web") ? "/web" : "/mobile";
}

export default function RedemptionProgressPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { fUser: user, status } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isJa = language === "ja";
  const gateLang = isJa ? "ja" : "en";
  const base = pathBase();
  const batch = redemptionBatchScheduleCopy(gateLang);

  const [request, setRequest] = useState<RedemptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (status !== "ready" || !user || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await fetchMeRedemption(id);
      setRequest(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [status, user, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const stepIdx = request ? progressStepIndex(request.status) : -1;
  const terminalBad =
    request?.status === "cancelled" || request?.status === "rejected";

  async function onCancel() {
    if (!request) return;
    setBusy(true);
    try {
      const row = await cancelMeRedemption(request.id);
      setRequest(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitDraft() {
    if (!request) return;
    setBusy(true);
    try {
      const row = await submitMeRedemptionDraft(request.id);
      setRequest(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProfileCyberPage
      title="TRACK"
      eyebrow="UNIT EXCHANGE"
      subtitle={
        isJa
          ? "申請から配送までの進捗。購入は月末まとめ（おおよそ25日前後）です。"
          : "Track review through delivery. Purchase is batched near month-end (~25th)."
      }
      contentClassName="max-w-lg space-y-4"
    >
      <Link
        href={`${base}/redeem`}
        className="text-[11px] text-cyan-300/80 hover:underline"
      >
        ← {isJa ? "交換トップ" : "Redeem home"}
      </Link>

      <div className="rounded-[2px] border border-cyan-300/25 bg-cyan-400/5 px-3 py-2.5 text-[12px] leading-relaxed text-cyan-50/85">
        {batch.detail}
      </div>

      {loading ? (
        <p className="text-[13px] text-white/45">
          {isJa ? "読み込み中…" : "Loading…"}
        </p>
      ) : error ? (
        <p className="text-[13px] text-rose-300/80">{error}</p>
      ) : !request ? (
        <p className="text-[13px] text-white/45">
          {isJa ? "申請が見つかりません。" : "Request not found."}
        </p>
      ) : (
        <>
          <div className="rounded-[2px] border border-white/10 bg-[rgba(4,9,16,0.97)] px-3 py-3">
            <p className="text-[14px] font-semibold text-white/90">
              {request.productName}
            </p>
            <p className="mt-1 text-[12px] text-white/50">
              {redemptionStatusLabel(request.status, gateLang)} ·{" "}
              {request.unitsRequired} Unit
            </p>
            {request.status === "pending" ||
            request.status === "needs_revision" ? (
              <p className="mt-2 text-[12px] text-cyan-100/75">
                {batch.pendingHint}
              </p>
            ) : null}
            {request.status === "approved" ? (
              <p className="mt-2 text-[12px] text-cyan-100/75">
                {batch.approvedHint}
              </p>
            ) : null}
            {request.trackingNumber ? (
              <p className="mt-2 text-[12px] text-cyan-200/90">
                {isJa ? "追跡" : "Tracking"}: {request.trackingCarrier ?? "—"}{" "}
                {request.trackingNumber}
              </p>
            ) : null}
            {request.adminNote ? (
              <p className="mt-2 text-[12px] text-amber-100/80">
                {request.adminNote}
              </p>
            ) : null}
          </div>

          {!terminalBad ? (
            <ol className="space-y-2">
              {REDEMPTION_PROGRESS_STEPS.map((step, i) => {
                const done = stepIdx >= i;
                const current = stepIdx === i;
                return (
                  <li
                    key={step}
                    className={[
                      "flex items-center gap-3 rounded-[2px] border px-3 py-2",
                      current
                        ? "border-cyan-300/40 bg-cyan-400/10"
                        : done
                          ? "border-emerald-300/25 bg-emerald-400/5"
                          : "border-white/10 bg-black/30",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        nameOxanium.className,
                        "text-[11px] font-bold tabular-nums",
                        done ? "text-emerald-300" : "text-white/35",
                      ].join(" ")}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] text-white/85">
                      {redemptionStatusLabel(step, gateLang)}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-[2px] border border-rose-300/30 bg-rose-400/10 px-3 py-3 text-[13px] text-rose-100/90">
              {redemptionStatusLabel(request.status, gateLang)}
            </p>
          )}

          <section className="space-y-2">
            <h2
              className={[
                nameOxanium.className,
                "text-[11px] font-bold uppercase tracking-[0.16em] text-white/55",
              ].join(" ")}
            >
              {isJa ? "履歴" : "Timeline"}
            </h2>
            <ul className="space-y-1.5">
              {[...request.timeline].reverse().map((ev, i) => (
                <li
                  key={`${ev.status}-${ev.atMs}-${i}`}
                  className="flex gap-3 text-[12px] text-white/60"
                >
                  <span className="w-16 shrink-0 tabular-nums text-white/35">
                    {ev.atMs
                      ? new Date(ev.atMs).toLocaleDateString(
                          isJa ? "ja-JP" : "en-US",
                          { month: "short", day: "numeric" }
                        )
                      : "—"}
                  </span>
                  <span>
                    {redemptionStatusLabel(ev.status, gateLang)}
                    {ev.note ? ` — ${ev.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-2 pt-1">
            {request.status === "draft" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onSubmitDraft()}
                className={[
                  nameOxanium.className,
                  "border border-cyan-300/40 bg-cyan-400/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-50 disabled:opacity-50",
                ].join(" ")}
              >
                {isJa ? "申請を送信" : "Submit draft"}
              </button>
            ) : null}
            {canUserCancelRedemption(request.status) ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onCancel()}
                className={[
                  nameOxanium.className,
                  "border border-rose-300/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-200/90 disabled:opacity-50",
                ].join(" ")}
              >
                {isJa ? "申請を取り消す" : "Cancel request"}
              </button>
            ) : null}
          </div>
        </>
      )}
    </ProfileCyberPage>
  );
}
