"use client";

import { usePathname } from "next/navigation";
import GamesPageBackground from "@/app/component/games/GamesPageBackground";

/**
 * アプリ全体で1インスタンスのサイバー背景。
 * ルート layout に置き、ページ遷移でアンマウントされない（オーロラ位相も継続）。
 */
export default function AppPageBackground() {
  const pathname = usePathname();
  const isMobile = pathname?.startsWith("/mobile") ?? false;
  /** ランキングはオーロラ・モートをフル表示（lite だと粒と色相が弱く見える） */
  const isRankings =
    pathname === "/mobile/rankings" || pathname === "/web/rankings";
  const lite = isMobile && !isRankings;

  return <GamesPageBackground lite={lite} />;
}
