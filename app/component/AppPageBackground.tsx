"use client";

import GamesPageBackground from "@/app/component/games/GamesPageBackground";

/**
 * アプリ全体で1インスタンスのサイバー背景。
 * ルート layout に置き、ページ遷移でアンマウントされない（オーロラ位相も継続）。
 */
export default function AppPageBackground() {
  /** モバイル含め常にフル表示（オーロラ4層＋上昇バーティクル） */
  return <GamesPageBackground lite={false} />;
}
