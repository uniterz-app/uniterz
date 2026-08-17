"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";

import MatchCard from "@/app/component/games/MatchCard";
import MobilePageShell from "@/app/component/common/MobilePageShell";

// ★ 新しい勝敗分布ドーナツ（V2）
import GamePredictionDistributionV2 from "@/app/component/predict/GamePredictionDistribution";

import { toMatchCardProps } from "@/lib/games/transform";
import { fetchPlayoffSeriesPeerGames } from "@/lib/games/fetchPlayoffSeriesPeerGames";
import { Pencil } from "lucide-react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";

import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";

type MatchCardLoaded = ReturnType<typeof toMatchCardProps> & {
  hideActions: true;
};

export default function Page() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const gameId = String(id);

  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const m = t(language);
  const uid = fUser?.uid ?? null;

  const [hasMyPost, setHasMyPost] = useState<boolean | null>(null);

  // 🔍 自分の投稿チェック
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
          dense: true,
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

  const title = useMemo(() => {
    if (!matchProps) {
      return language === "ja" ? "コミュニティ予想" : "Community picks";
    }
    return `${awayName} vs ${homeName}`;
  }, [matchProps, homeName, awayName, language]);

  return (
    <MobilePageShell
      eyebrow="GAMES"
      title={title}
      onClose={() => router.back()}
      backAriaLabel={m.common.back}
    >
      <h1 className="sr-only">Predictions (Mobile) for {gameId}</h1>

      {!loading && matchProps && (
        <MatchCard {...matchProps} language={language} />
      )}

      <div className="mt-2">
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

      {uid && hasMyPost === false && (
        <button
          onClick={() => router.push(`/mobile/games/${gameId}/predict`)}
          className="
      fixed bottom-24 right-6 z-50
      w-13 h-13 rounded-full
      bg-yellow-400 text-white
      flex items-center justify-center
      shadow-xl
      active:scale-90 transition-transform
    "
          aria-label={m.games.predict}
        >
          <Pencil size={22} strokeWidth={3} />
        </button>
      )}
    </MobilePageShell>
  );
}
