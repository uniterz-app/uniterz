"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

export default function CancelPlanPage() {
  const router = useRouter();

  const [proUntil, setProUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();
      if (data.proUntil) {
        setProUntil(
          data.proUntil.toDate().toLocaleDateString("ja-JP")
        );
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div className="p-4 text-white/60">loading...</div>;
  }

  const handleCancel = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    // モーダルを閉じる
    setOpen(false);

    // 解約処理開始（Stripe Portal）
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        returnUrl: "/mobile/cancel-complete",  // 解約後に遷移させたいページ
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url; // Stripeポータルへ遷移
    }
  };

  return (
    <div className="min-h-screen bg-app px-4 py-10 flex justify-center">
      <div className="w-full max-w-md rounded-3xl bg-black/80 border border-white/10 px-6 py-8">

        {/* Title */}
        <h1 className="text-xl font-bold text-white mb-4">
          Proプランの解約
        </h1>

        {/* Notice */}
        <div className="space-y-2 text-sm text-white/70 mb-6">
          <p>・解約後も次回更新日まではPro機能をご利用いただけます。</p>
          <p>・即時解約ではなく、自動更新のみ停止されます。</p>
        </div>

        {/* Next renewal */}
        <div className="mb-6 text-sm text-white/80">
          次回更新日：
          <span className="ml-1 font-semibold">
            {proUntil ?? "-----"}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => setOpen(true)}  // モーダルを開く
            className="
              w-full rounded-xl py-3 font-bold text-red-400
              border border-red-400/40
              transition
              hover:bg-red-400/10
              active:scale-95 active:bg-red-400/20
            "
          >
            解約する
          </button>

          <button
            onClick={() => router.back()}
            className="
              w-full rounded-xl py-3 font-bold text-white/70
              border border-white/10
              transition
              hover:bg-white/5
              active:scale-95
            "
          >
            戻る
          </button>
        </div>
      </div>

      {/* ===== Confirm Modal ===== */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)} // モーダルを閉じる
          />

          {/* modal */}
          <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-black border border-white/10 px-6 py-6">
            <h2 className="text-lg font-bold text-white mb-3">
              解約をする
            </h2>

            <p className="text-sm text-white/70 mb-6">
              解約後も <span className="font-semibold">{proUntil}</span> までは
              Pro機能をご利用いただけます。
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)} // モーダルを閉じる
                className="
                  flex-1 rounded-xl py-2 font-bold text-white/70
                  border border-white/10
                  transition
                  hover:bg-white/5
                  active:scale-95
                "
              >
                キャンセル
              </button>

              <button
                onClick={handleCancel} // 解約確定処理を実行
                className="
                  flex-1 rounded-xl py-2 font-bold text-red-400
                  border border-red-400/40
                  transition
                  hover:bg-red-400/10
                  active:scale-95 active:bg-red-400/20
                "
              >
                解約を確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
