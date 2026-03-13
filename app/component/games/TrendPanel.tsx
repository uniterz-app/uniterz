// app/component/games/TrendPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  fetchTrendCacheGames,
  selectLeagueGames,
  toDisplayDatetime,
  type TrendCacheGames,
} from "@/lib/trend";

import MatchCard, { type MatchCardProps } from "@/app/component/games/MatchCard";
import { toMatchCardProps, type GameDoc } from "@/lib/games/transform";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Flame, CheckCircle } from "lucide-react";

import TrendHitPostsSection from "@/app/component/games/TrendHitPostsSection";
import TrendUsersSection from "@/app/component/games/TrendUsersSection";

export default function TrendPanel() {
  const pathname = usePathname();
  const basePath: "/web" | "/mobile" =
    pathname?.startsWith("/mobile") ? "/mobile" : "/web";
  const isMobile = basePath === "/mobile";

  const [cache, setCache] = useState<TrendCacheGames | null>(null);
  const [leagueCards, setLeagueCards] = useState<
    Record<string, MatchCardProps[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchGameProps = useMemo(
    () => async (id: string): Promise<MatchCardProps | null> => {
      try {
        const snap = await getDoc(doc(db, "games", id));
        if (!snap.exists()) return null;
        const raw = { id, ...(snap.data() as any) } as GameDoc;
        return toMatchCardProps(raw, { dense: isMobile });
      } catch {
        return null;
      }
    },
    [isMobile]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const c = await fetchTrendCacheGames();
        if (!mounted) return;
        setCache(c);

        // 🔥 表示順序はここで制御（今は NBA → B1）
const TARGET_LEAGUES = [
  { key: "NBA" as const, label: "NBA" },
  // { key: "PL" as const, label: "Premier League" }, ← 削除
  { key: "B1" as const, label: "B.LEAGUE (B1)" },
];

        const cards: Record<string, MatchCardProps[]> = {};

        // 🔥 各リーグの HOT 試合を取得
        for (const lg of TARGET_LEAGUES) {
          const topGames = selectLeagueGames(c, lg.key, 1);

          cards[lg.key] = await Promise.all(
            topGames.map((g) => fetchGameProps(g.gameId))
          ).then((arr) => arr.filter(Boolean) as MatchCardProps[]);
        }

        if (!mounted) return;
        setLeagueCards(cards);
      } catch (e: any) {
        if (mounted) setErr(e?.message ?? "failed to load trend data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchGameProps]);

  if (loading) return <div className="text-white/70">読み込み中…</div>;
  if (err) return <div className="text-red-400">エラー: {err}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">次の節の注目カード</h2>
        {cache?.updatedAt && (
          <span className="text-xs text-white/50">
            {toDisplayDatetime(cache.updatedAt)}
          </span>
        )}
      </div>

      {/* 🔥 動的表示（NBA → PL → B1） */}
{[
  { key: "NBA", label: "NBA" },
  // { key: "PL", label: "Premier League" }, ← 削除
  { key: "B1", label: "B.LEAGUE (B1)" },
].map(({ key, label }) => {
  const cards = leagueCards[key] ?? [];

  return (
    <section key={key} className="space-y-3">
      <h3 className="text-sm font-semibold text-white/80">
        {label}
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {cards.length === 0 ? (
          <EmptyCard />
        ) : (
          cards.map((p) => (
            <HotBadge key={`${key}:${p.id}`}>
              <MatchCard {...p} />
            </HotBadge>
          ))
        )}
      </div>
    </section>
  );
})}
      {/* 🔥 連勝中ユーザー */}
      <section className="space-y-3 mt-10">
        <div className="flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">連勝中ユーザー</h3>
        </div>

        {/* 連勝中ユーザーの一覧 */}
        <TrendUsersSection />
      </section>

      {/* 的中投稿 */}
      <section className="space-y-3 mt-10">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">的中投稿</h3>
        </div>

        <TrendHitPostsSection />
      </section>
    </div>
  );
}

function EmptyCard() {
  return (
    <div className="rounded-xl border border-white/10 p-4 text-white/60 text-sm">
      まだ集計データがありません。
    </div>
  );
}

/* =======================================================
   🔥 HOT バッジ
   ======================================================= */
function HotBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute left-2.5 top-2.5 md:left-3 md:top-3 z-10 pointer-events-none">
        <span
          className="
            inline-flex items-center gap-1
            px-2 py-[1px] md:px-2.5 md:py-[2px]
            rounded-full text-[10px] md:text-[13px]
            font-bold text-white
            bg-gradient-to-r from-rose-500 to-orange-400
            shadow-[0_2px_10px_rgba(255,100,80,0.35)]
            ring-1 ring-white/30
          "
        >
          <Flame className="w-3 h-3 md:w-3.5 md:h-3.5" />
          <span className="relative top-[0.3px] md:top-0">HOT</span>
        </span>
      </div>

      {children}
    </div>
  );
}
