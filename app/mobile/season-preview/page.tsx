"use client";

/**
 * /mobile/season-preview
 * シーズン予想まわりプレビューのモバイル入口
 */

import Link from "next/link";
import { jp, nameOxanium } from "@/lib/fonts";

const LINKS = [
  {
    href: "/mobile/season-standings-preview",
    title: "順位予想（入力）",
    note: "East / West 1–15",
  },
  {
    href: "/mobile/season-awards-preview",
    title: "アワード予想（入力）",
    note: "人気5 + 前方一致",
  },
  {
    href: "/mobile/season-picks-view-preview",
    title: "提出後ビュー",
    note: "順位表 + アワード出力",
  },
  {
    href: "/mobile/predict-timing-preview",
    title: "予想オーバーレイ",
    note: "Insight / Injury / Stats / Roster",
  },
  {
    href: "/mobile/live-game-stats-preview",
    title: "ライブ試合スタッツ",
    note: "Team Stats + Box Score",
  },
  {
    href: "/mobile/stats-preview",
    title: "STATS",
    note: "Team / Player · タブ切替",
  },
  {
    href: "/mobile/pro-subscribe-preview",
    title: "Pro 課金導線",
    note: "3プラン → 成功画面",
  },
  {
    href: "/mobile/tutorial-preview",
    title: "初回チュートリアル",
    note: "ハイブリッド練習ツアー",
  },
] as const;

export default function MobileSeasonPreviewHubPage() {
  return (
    <main className="min-h-screen bg-[#050b14] px-3 py-6 text-white">
      <div className="mx-auto max-w-lg space-y-4">
        <header className="space-y-2">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70",
            ].join(" ")}
          >
            Mobile · Feature preview hub
          </p>
          <h1 className={`${jp.className} text-xl font-bold tracking-tight`}>
            シーズン / 予想プレビュー
          </h1>
          <p className="text-[13px] leading-relaxed text-white/55">
            機能検証用。デザイン専用プレビューは削除済み。
          </p>
        </header>

        <ul className="space-y-2">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg border border-white/12 bg-white/[0.03] px-3.5 py-3 transition hover:border-cyan-300/35 hover:bg-white/[0.05]"
              >
                <p className={`${jp.className} text-[15px] font-semibold text-white`}>
                  {item.title}
                </p>
                <p
                  className={[
                    nameOxanium.className,
                    "mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40",
                  ].join(" ")}
                >
                  {item.note}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
