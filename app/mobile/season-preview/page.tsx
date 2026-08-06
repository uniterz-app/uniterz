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
    note: "Team Stats / Box Score（mock）",
  },
  {
    href: "/mobile/team-stats-preview",
    title: "リーグ Team Stats",
    note: "30 チーム表 · ソート · 比較（mock）",
  },
  {
    href: "/mobile/rank-gap-preview",
    title: "Gap / Shadow",
    note: "Rank Intel",
  },
  {
    href: "/mobile/pro-subscribe-preview",
    title: "Pro 課金導線",
    note: "3プラン → 成功画面",
  },
  {
    href: "/mobile/settings-bg-preview",
    title: "設定画面の背景色",
    note: "SETTINGS 背景スウォッチ切替",
  },
  {
    href: "/mobile/berserk-pro-skin-preview",
    title: "Pro Skin · ベルセルク風",
    note: "赤×黒ダーク案 3 つ",
  },
  {
    href: "/mobile/cosmos-pro-skin-preview",
    title: "Pro Skin · Design Lab",
    note: "線画ラボ / メタリック",
  },
  {
    href: "/mobile/wave-pro-skin-preview",
    title: "Pro Skin · Wave 13",
    note: "9テーマ SVG 線画プレビュー",
  },
  {
    href: "/mobile/ranking-list-pro-skin-preview",
    title: "Pro Skin · ランキング行",
    note: "採用30種のリスト行デザイン一覧",
  },
  {
    href: "/mobile/pro-skin-unlock-preview",
    title: "Pro Skin 解放モーダル",
    note: "マイルストーン達成通知",
  },
  {
    href: "/mobile/tutorial-preview",
    title: "初回チュートリアル",
    note: "スライド / スポットライト / ハイブリッド比較",
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
            Mobile · Dev hub
          </p>
          <h1 className={[jp.className, "text-xl font-bold"].join(" ")}>
            プレビュー一覧
          </h1>
          <p className="text-xs leading-relaxed text-white/45">
            スマホ幅の mobile ルート。本番未接続の UI 確認用。
          </p>
        </header>

        <ul className="space-y-2">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block border border-cyan-300/20 bg-[rgba(6,10,16,0.92)] px-3 py-3 transition hover:border-cyan-300/40"
              >
                <p
                  className={[
                    nameOxanium.className,
                    "text-[12px] font-extrabold uppercase tracking-[0.08em] text-cyan-100",
                  ].join(" ")}
                >
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] text-white/40">{item.note}</p>
                <p className="mt-1 text-[10px] text-white/25">{item.href}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
