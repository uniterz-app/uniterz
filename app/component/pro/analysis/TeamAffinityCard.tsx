"use client";

import { Trophy, Users } from "lucide-react"; // アイコン変更
import { useEffect, useRef, useState } from "react";
import { Alfa_Slab_One } from "next/font/google";

const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
});

type TeamStat = {
  teamId: string;
  teamName: string;
  games: number;
  winRate: number; // 0–1
};

type Props = {
  strong: TeamStat[];
  weak: TeamStat[];
};

export default function TeamAffinityCard({ strong, weak }: Props) {
  return (
    <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
      <div className="mb-3 text-sm font-semibold text-white flex items-center gap-2">
        {/* チーム別パフォーマンスタイトルにアイコン追加 */}
        <div className="h-5 w-5 rounded-full bg-black flex items-center justify-center"> {/* 枠色を黒に変更 */}
          <Trophy className="h-3 w-3 text-orange-400" /> {/* アイコンをオレンジに変更 */}
        </div>
        <span>チーム別パフォーマンス</span>
      </div>

      {/* 横並び */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamList
          title="相性の良いチーム"
          color="emerald"
          data={strong}
        />
        <TeamList
          title="相性の悪いチーム"
          color="rose"
          data={weak}
        />
      </div>
    </div>
  );
}

/* =========================
 * Team List
 * ========================= */

function TeamList({
  title,
  color,
  data,
}: {
  title: string;
  color: "emerald" | "rose";
  data: TeamStat[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const textColor =
    color === "emerald" ? "text-emerald-400" : "text-rose-400";
  const barColor =
    color === "emerald"
      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
      : "bg-gradient-to-r from-rose-400 to-rose-500";

  return (
    <div ref={ref}>
      <div className={`mb-2 text-xs font-semibold ${textColor}`}>
        {title}
      </div>

      {/* ★ データ不足 */}
      {data.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-center">
          <div className="text-xs font-semibold text-white/60">
            データ不足
          </div>
          <div className="mt-1 text-[11px] text-white/40 leading-relaxed">
            各チーム最低5投稿が必要です
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((t, index) => {
            const rate = Math.round(t.winRate * 100);

            return (
              <div
                key={t.teamId}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                {/* 上段 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {t.teamName}
                    </span>
                  </div>

                  <div className="text-right text-xs">
                    <div className="text-white/60">
                      {t.games}試合
                    </div>
                    <div className={`font-semibold ${textColor}`}>
                      {rate}%
                    </div>
                  </div>
                </div>

                {/* バー */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-2 rounded-full ${barColor} transition-all ease-out`}
                    style={{
                      width: visible ? `${rate}%` : "0%",
                      transitionDuration: "1600ms",
                      transitionDelay: `${index * 240}ms`,
                    }}
                  />
                </div>

                {/* ひとこと */}
                <div className="mt-1 text-[10px] text-white/40">
                  {rate >= 70
                    ? "安定して勝てている"
                    : rate >= 55
                    ? "やや相性が良い"
                    : rate >= 45
                    ? "五分の相性"
                    : "相性が悪い"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
