"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DonutChart from "./DonutChart";

type Props = {
  gameId: string;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
};

export default function GamePredictionDistribution({
  gameId,
  homeName,
  awayName,
  homeColor,
  awayColor,
}: Props) {
  const [homeCount, setHomeCount] = useState(0);
  const [awayCount, setAwayCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("gameId", "==", gameId),
      where("schemaVersion", "==", 2)
    );

    const unsub = onSnapshot(q, (snap) => {
      let h = 0;
      let a = 0;

      snap.docs.forEach((doc) => {
        const data = doc.data() as any;

        // winner 判定（あらゆるパターンを吸収）
        const winner =
          data?.score?.winner ??
          data?.prediction?.winner ??
          data?.winner ??
          null;

        if (winner === "home") h++;
        else if (winner === "away") a++;
      });

      setHomeCount(h);
      setAwayCount(a);
    });

    return () => unsub();
  }, [gameId]);

  const total = homeCount + awayCount;

  if (total === 0) {
    return (
      <div className="rounded-xl p-4 border border-white/10 text-white/70">
        まだこの試合の予想がありません。
      </div>
    );
  }

  const segments = [
    { label: homeName, value: homeCount / total, color: homeColor },
    { label: awayName, value: awayCount / total, color: awayColor },
  ];

  return (
    <div className="rounded-xl p-4 border border-white/10 text-white">

      {/* === 円グラフ & 凡例を横並び === */}
      <div
        className="
          flex
          justify-center
          items-center
          gap-6              /* ← 円と凡例の間を空ける */
          md:gap-10
        "
      >
        {/* 円グラフ（大きく） */}
        <div className="flex-shrink-0">
          <DonutChart segments={segments} size={260} thickness={80} />
        </div>

        {/* 凡例（縦並び・中央寄せ） */}
        <div className="space-y-3 text-sm">

          {/* HOME */}
          <div className="flex items-center justify-center gap-3">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: homeColor }} />
            <span className="whitespace-nowrap">{homeName}</span>
            <span className="tabular-nums">{((homeCount / total) * 100).toFixed(1)}%</span>
          </div>

          {/* AWAY */}
          <div className="flex items-center justify-center gap-3">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: awayColor }} />
            <span className="whitespace-nowrap">{awayName}</span>
            <span className="tabular-nums">{((awayCount / total) * 100).toFixed(1)}%</span>
          </div>

        </div>
      </div>
    </div>
  );
}

