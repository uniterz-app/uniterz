"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DonutChart from "./DonutChart";

type Props = {
  gameId: string;
  league: "nba" | "bj" | "j1" | "pl";
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
};

export default function GamePredictionDistribution({
  gameId,
  league,
  homeName,
  awayName,
  homeColor,
  awayColor,
}: Props) {
  const [homeCount, setHomeCount] = useState(0);
const [awayCount, setAwayCount] = useState(0);
const [drawCount, setDrawCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("gameId", "==", gameId),
      where("schemaVersion", "==", 2)
    );

    const unsub = onSnapshot(q, (snap) => {
      let h = 0;
let a = 0;
let d = 0;

snap.docs.forEach((doc) => {
  const data = doc.data() as any;

  const winner =
    data?.prediction?.winner ??
    data?.winner ??
    null;

  if (winner === "home") h++;
  else if (winner === "away") a++;
  else if (winner === "draw") d++;
});

setHomeCount(h);
setAwayCount(a);
setDrawCount(d);
    });

    return () => unsub();
  }, [gameId]);
  const isSoccer = league === "j1" || league === "pl";
  const total = homeCount + awayCount + (isSoccer ? drawCount : 0);

  if (total === 0) {
    return (
      <div className="rounded-xl p-4 border border-white/10 text-white/70">
        まだこの試合の予想がありません。
      </div>
    );
  }

  const segments = isSoccer
  ? [
      {
        label: homeName,
        value: homeCount / total,
        color: homeColor,
      },
      {
        label: "引き分け",
        value: drawCount / total,
        color: "#9ca3af", // グレー
      },
      {
        label: awayName,
        value: awayCount / total,
        color: awayColor,
      },
    ]
  : [
      {
        label: homeName,
        value: homeCount / total,
        color: homeColor,
      },
      {
        label: awayName,
        value: awayCount / total,
        color: awayColor,
      },
    ];

  return (
    <div className="rounded-xl p-4 border border-white/10 text-white">
      <div
        className="
          flex flex-col items-center gap-4
          md:flex-row md:items-center md:gap-10
        "
      >
        {/* ==== 円グラフ ==== */}
        <div className="flex-shrink-0">
          <div className="md:hidden">
            <DonutChart segments={segments} size={140} thickness={50} />
          </div>
          <div className="hidden md:block">
            <DonutChart segments={segments} size={260} thickness={80} />
          </div>
        </div>

        {/* ==== 凡例 ==== */}
        <div className="space-y-3 text-sm md:space-y-4 md:text-base">

          {/* ★★ 追加部分：凡例の上に総分析数を表示 ★★ */}
          <div className="text-center md:text-left text-white/70 text-xs md:text-sm mb-2">
            総分析数：<span className="tabular-nums">{total}</span>
          </div>

          {/* HOME */}
          <div className="flex items-center justify-center gap-3">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: homeColor }} />
            <span className="whitespace-nowrap">{homeName}</span>
            <span className="tabular-nums">
              {((homeCount / total) * 100).toFixed(1)}%
            </span>
          </div>

          {/* AWAY */}
          <div className="flex items-center justify-center gap-3">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: awayColor }} />
            <span className="whitespace-nowrap">{awayName}</span>
            <span className="tabular-nums">
              {((awayCount / total) * 100).toFixed(1)}%
            </span>
          </div>
          {isSoccer && (
  <div className="flex items-center justify-center gap-3">
    <span className="w-3 h-3 rounded-sm bg-gray-400" />
    <span className="whitespace-nowrap">引き分け</span>
    <span className="tabular-nums">
      {((drawCount / total) * 100).toFixed(1)}%
    </span>
  </div>
)}
        </div>
      </div>
    </div>
  );
}

