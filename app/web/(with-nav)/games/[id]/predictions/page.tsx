"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import MatchCard from "@/app/component/games/MatchCard";
import PredictionListByGame from "@/app/component/post/PredictionListByGame";
import GamePredictionDistribution from "@/app/component/predict/GamePredictionDistribution";
import { toMatchCardProps } from "@/lib/games/transform";

type GameDoc = Parameters<typeof toMatchCardProps>[0];

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const gameId = String(id);

  const [rawGame, setRawGame] = useState<GameDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "games", gameId));
        if (!alive) return;
        setRawGame(snap.exists() ? ({ id: snap.id, ...snap.data() } as GameDoc) : null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [gameId]);

  const matchProps = useMemo(() => {
    if (!rawGame) return null;
    const base = toMatchCardProps(rawGame, { dense: false });
    return { ...base, hideActions: true };
  }, [rawGame]);

  const homeName = matchProps?.home.name ?? "";
  const awayName = matchProps?.away.name ?? "";
  const homeColor = matchProps?.home.colorHex ?? "#0ea5e9";
  const awayColor = matchProps?.away.colorHex ?? "#f43f5e";

  return (
    <div className="
  mx-auto w-full
  px-3 md:px-6 py-4 md:py-6
  md:max-w-[960px] lg:max-w-[1120px] xl:max-w-[1280px] 2xl:max-w-[1440px]
">
      <h1 className="sr-only">Predictions for {gameId}</h1>

      {!loading && matchProps && <MatchCard {...matchProps} />}

      <div className="mt-3 md:mt-4">
        <GamePredictionDistribution
          gameId={gameId}
          homeName={homeName}
          awayName={awayName}
          homeColor={homeColor}
          awayColor={awayColor}
          maxLegend={5}
        />
      </div>

      <div className="mt-3 md:mt-4">
        <PredictionListByGame gameId={gameId} />
      </div>
    </div>
  );
}
