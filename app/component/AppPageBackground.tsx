"use client";

import { usePathname } from "next/navigation";
import GamesPageBackground from "@/app/component/games/GamesPageBackground";

/**
 * アプリ全体で1インスタンスのサイバー背景。
 * ルート layout に置き、ページ遷移でアンマウントされない（オーロラ位相も継続）。
 */
export default function AppPageBackground() {
  const pathname = usePathname();
  const lite = pathname?.startsWith("/mobile") ?? false;

  return <GamesPageBackground lite={lite} />;
}
