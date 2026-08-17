// app/web/cancel-plan/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { nameOxanium, jp } from "@/lib/fonts";
import { PRO_SUCCESS_ACCENT } from "@/lib/pro/proSuccessAccent";

const A = PRO_SUCCESS_ACCENT.cancel;

export default function CancelPlanPage() {
  const router = useRouter();

  const [proUntil, setProUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const data = snap.data();
      if (data.proUntil) {
        setProUntil(data.proUntil.toDate().toLocaleDateString("ja-JP"));
      }

      setLoading(false);
    };

    void fetchUser();
  }, []);

  const handleCancel = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || busy) return;

    setBusy(true);
    setOpen(false);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          returnUrl: "/web/cancel-complete",
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <CandleChartLoader />
      </div>
    );
  }

  const untilLabel = proUntil ?? "-----";

  return (
    <ProfileCyberPage
      title="CANCEL"
      subtitle="Pro プランの解約手続きを行います。"
      contentClassName="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-md flex-col justify-center px-4 py-6"
    >
      <div className="relative w-full pb-[7px] pr-[7px] pt-2 pl-2">
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-20 h-[18px] w-[18px] border-l-[3px] border-t-[3px]"
          style={{
            borderColor: A.main,
            boxShadow: `0 0 10px rgba(${A.mainRgb},0.35)`,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 z-20 h-[18px] w-[18px] border-b-[3px] border-r-[3px]"
          style={{
            borderColor: A.main,
            boxShadow: `0 0 10px rgba(${A.mainRgb},0.35)`,
          }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 right-0 top-2 left-2 z-0"
          style={{
            backgroundColor: A.main,
            boxShadow: `0 0 28px rgba(${A.mainRgb},0.22)`,
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
                CANCEL_FLOW // TYPE: PRO
              </p>
              <p
                className={[
                  nameOxanium.className,
                  "mt-0.5 text-[18px] font-black uppercase leading-none tracking-[0.08em] text-black",
                ].join(" ")}
              >
                CANCEL PLAN
              </p>
            </div>
            <div
              className={[
                nameOxanium.className,
                "relative z-[1] flex shrink-0 flex-col justify-center border-l-[2.5px] border-black/15 px-2.5 py-2 text-right text-[8px] font-bold uppercase leading-tight tracking-[0.06em] text-black/70",
              ].join(" ")}
            >
              <span>AUTH: PAID</span>
              <span className="mt-0.5">MODE: RENEWAL OFF</span>
            </div>
          </div>

          <div className="relative px-4 py-5 text-left">
            <h1
              className={[
                nameOxanium.className,
                "text-[16px] font-extrabold tracking-[0.06em] text-white",
              ].join(" ")}
            >
              Proプランの解約
            </h1>

            <div
              className={[jp.className, "mt-3 space-y-2 text-sm text-white/70"].join(
                " "
              )}
            >
              <p>・解約後も次回更新日まではPro機能をご利用いただけます。</p>
              <p>・即時解約ではなく、自動更新のみ停止されます。</p>
            </div>

            <p className={[jp.className, "mt-4 text-sm text-white/80"].join(" ")}>
              次回更新日：
              <span
                className="ml-1 font-semibold"
                style={{ color: A.title }}
              >
                {untilLabel}
              </span>
            </p>

            <div className="mt-5 grid gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={[
                  nameOxanium.className,
                  "w-full border-2 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] transition hover:brightness-110 active:scale-[0.99]",
                ].join(" ")}
                style={{
                  borderColor: A.main,
                  color: A.main,
                  boxShadow: `0 0 16px rgba(${A.mainRgb},0.18)`,
                }}
              >
                解約する
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className={[
                  nameOxanium.className,
                  "w-full border py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 transition hover:text-white/80",
                ].join(" ")}
                style={{ borderColor: "rgba(255,255,255,0.14)" }}
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm pb-[6px] pr-[6px] pt-1.5 pl-1.5">
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-20 h-4 w-4 border-l-[3px] border-t-[3px]"
              style={{ borderColor: A.main }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-0 z-20 h-4 w-4 border-b-[3px] border-r-[3px]"
              style={{ borderColor: A.main }}
            />
            <div
              aria-hidden
              className="absolute bottom-0 right-0 top-1.5 left-1.5 z-0"
              style={{ backgroundColor: A.main }}
            />
            <div className="relative z-10 border-[2.5px] border-white bg-[#04080f] px-4 py-5 text-left">
              <p
                className={[
                  nameOxanium.className,
                  "text-[8px] font-bold uppercase tracking-[0.16em]",
                ].join(" ")}
                style={{ color: A.metaLabel }}
              >
                CONFIRM // CANCEL
              </p>
              <h2
                className={[
                  nameOxanium.className,
                  "mt-1 text-[16px] font-extrabold tracking-[0.06em] text-white",
                ].join(" ")}
              >
                解約をする
              </h2>
              <p className={[jp.className, "mt-3 text-sm leading-relaxed text-white/70"].join(" ")}>
                解約後も{" "}
                <span className="font-semibold text-white/90">{untilLabel}</span>{" "}
                までは Pro機能をご利用いただけます。
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={[
                    nameOxanium.className,
                    "flex-1 border py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/60",
                  ].join(" ")}
                  style={{ borderColor: "rgba(255,255,255,0.14)" }}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  disabled={busy}
                  className={[
                    nameOxanium.className,
                    "flex-1 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] disabled:opacity-55",
                  ].join(" ")}
                  style={{
                    backgroundColor: A.main,
                    color: A.ink,
                    boxShadow: `0 0 14px rgba(${A.mainRgb},0.28)`,
                  }}
                >
                  解約を確定
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ProfileCyberPage>
  );
}
