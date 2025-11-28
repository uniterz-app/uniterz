// app/component/ui/ToastHost.tsx
"use client";

import { useEffect, useState } from "react";
import { _registerToastHost } from "./toast";

type Item = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

export default function ToastHost() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    _registerToastHost((t) => {
      setItems((prev) => [...prev, t]);

      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, 3000);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto flex items-center gap-3",
            "px-5 py-4 w-[min(90vw,540px)] rounded-2xl",
            "shadow-2xl text-white",
            // ★ X風カラーリング
            "bg-[#0d1a20]/95 border border-[#1a2f38]",
            "backdrop-blur-xl",

            // アニメーション
            "animate-[toastSlide_0.35s_ease-out]",
          ].join(" ")}
        >
          {/* 左丸アイコン */}
          <div
            className={[
              "flex items-center justify-center rounded-full h-8 w-8",
              t.type === "success"
                ? "bg-[#1d9bf0]"
                : t.type === "error"
                ? "bg-rose-500"
                : "bg-sky-500",
            ].join(" ")}
          >
            {t.type === "success" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : t.type === "error" ? (
              <span className="text-black font-bold text-lg">!</span>
            ) : (
              <span className="text-black font-bold text-lg">i</span>
            )}
          </div>

          {/* メッセージ */}
          <span className="text-[15px] font-medium tracking-wide">
            {t.message}
          </span>

          {/* アニメーション CSS */}
          <style jsx>{`
            @keyframes toastSlide {
              0% {
                opacity: 0;
                transform: translateY(-10px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}
