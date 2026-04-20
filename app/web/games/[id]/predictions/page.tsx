"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";

import MatchCard from "@/app/component/games/MatchCard";

// ★ 新しい V2 ドーナツチャート
import GamePredictionDistributionV2 from "@/app/component/predict/GamePredictionDistribution";

import { toMatchCardProps } from "@/lib/games/transform";
import { fetchPlayoffSeriesPeerGames } from "@/lib/games/fetchPlayoffSeriesPeerGames";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";

type MatchCardLoaded = ReturnType<typeof toMatchCardProps> & {
  hideActions: true;
};

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const gameId = String(id);

  const router = useRouter();
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? null;

  const [hasMyPost, setHasMyPost] = useState<boolean | null>(null);

  // 🔍 自分の投稿があるかチェック（1回だけ）
  useEffect(() => {
    if (!uid || !gameId) return;

    (async () => {
      const q = query(
        collection(db, "posts"),
        where("authorUid", "==", uid),
        where("gameId", "==", gameId),
        limit(1)
      );
      const snap = await getDocs(q);
      setHasMyPost(!snap.empty);
    })();
  }, [uid, gameId]);

  // 🔍 ゲーム情報取得（同一シリーズの兄弟試合を含めてシリーズ表記を一覧と揃える）
  const [matchProps, setMatchProps] = useState<MatchCardLoaded | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setMatchProps(null);
      try {
        const snap = await getDoc(doc(db, "games", gameId));
        if (!alive) return;

        if (!snap.exists()) {
          setMatchProps(null);
          return;
        }

        const raw = { id: snap.id, ...snap.data() } as Parameters<
          typeof toMatchCardProps
        >[0];
        const peers = await fetchPlayoffSeriesPeerGames(
          raw as Record<string, unknown>
        );
        if (!alive) return;
        const base = toMatchCardProps(raw, {
          dense: false,
          peerGamesForSeriesInference: peers,
        });
        setMatchProps({ ...base, hideActions: true } as MatchCardLoaded);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [gameId]);

  // 色・チーム名抽出
  const homeName = matchProps?.home.name ?? "";
  const awayName = matchProps?.away.name ?? "";

  const leagueNorm = matchProps?.league ? normalizeLeague(matchProps.league) : null;

  const homeColor =
    leagueNorm && matchProps?.home.teamId
      ? getTeamPrimaryColor(leagueNorm, matchProps.home.teamId)
      : "#0ea5e9";

  const awayColor =
    leagueNorm && matchProps?.away.teamId
      ? getTeamPrimaryColor(leagueNorm, matchProps.away.teamId)
      : "#f43f5e";

  return (
    <div
      className="
        mx-auto w-full
        px-3 md:px-6 py-4 md:py-6
        md:max-w-[960px] lg:max-w-[1120px] xl:max-w-[1280px] 2xl:max-w-[1440px]
      "
    >
      <h1 className="sr-only">Predictions for {gameId}</h1>

      {/* ==== ゲームカード ==== */}
      {!loading && matchProps && <MatchCard {...matchProps} />}

      {/* ==== 🎯 V2 勝者予想ドーナツ ==== */}
      <div className="mt-3 md:mt-4">
        {leagueNorm && (
  <GamePredictionDistributionV2
    gameId={gameId}
    league={leagueNorm}
    homeName={homeName}
    awayName={awayName}
    homeColor={homeColor}
    awayColor={awayColor}
  />
)}
      </div>

      {/* ==== 投稿一覧（TODO: コンポーネント実装） ==== */}

      {/* ==== 自分が投稿していない時だけ出す「投稿ボタン」 ==== */}
      {hasMyPost === false && (
        <button
          onClick={() => router.push(`/games/${gameId}/predict`)}
          className="
            fixed bottom-14 right-10 z-50
            w-14 h-14 rounded-full
            bg-yellow-400 text-white
            flex items-center justify-center
            shadow-xl
            hover:scale-110 active:scale-95
            transition-transform
          "
        >
          <Pencil size={30} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
