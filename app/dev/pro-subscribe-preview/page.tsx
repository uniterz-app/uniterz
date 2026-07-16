"use client";

/**
 * /dev/pro-subscribe-preview
 * Pro 課金導線プレビュー — プラン選択 → 模擬購入 → 成功画面
 */

import { useState } from "react";
import Link from "next/link";
import ProSubscribePreview from "@/app/component/pro/dev/ProSubscribePreview";
import { jp, nameOxanium } from "@/lib/fonts";

export default function ProSubscribePreviewPage() {
  const [language, setLanguage] = useState<"ja" | "en">("ja");

  return (
    <main className="min-h-screen bg-[#050b14] px-3 py-6 text-white sm:px-4">
      <div className="mx-auto max-w-xl space-y-5">
        <header className="space-y-2">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/70",
            ].join(" ")}
          >
            Dev preview · billing
          </p>
          <h1 className={[jp.className, "text-xl font-bold"].join(" ")}>
            Pro 課金導線
          </h1>
          <p className="text-xs leading-relaxed text-white/50">
            Weekly / Monthly / Season Pass。購入ボタンで成功画面までシミュレート（決済なし）。
          </p>
          <p className="text-[11px] text-white/40">
            <Link
              href="/mobile/pro-subscribe-preview"
              className="text-amber-200/80 underline-offset-2 hover:underline"
            >
              /mobile/pro-subscribe-preview
            </Link>
            {" · "}
            <Link
              href="/mobile/season-preview"
              className="text-white/45 underline-offset-2 hover:underline"
            >
              一覧
            </Link>
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLanguage("ja")}
            className={`rounded-lg border px-3 py-1 text-xs ${
              language === "ja"
                ? "border-white/30 bg-white/15 text-white"
                : "border-white/10 text-white/50"
            }`}
          >
            JA
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded-lg border px-3 py-1 text-xs ${
              language === "en"
                ? "border-white/30 bg-white/15 text-white"
                : "border-white/10 text-white/50"
            }`}
          >
            EN
          </button>
        </div>

        <ProSubscribePreview language={language} />
      </div>
    </main>
  );
}
