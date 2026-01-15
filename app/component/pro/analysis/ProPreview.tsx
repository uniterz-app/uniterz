"use client";

import { useState, useEffect } from "react";
import ProAnalysisView from "@/app/component/pro/analysis/ProAnalysisView";
import { useRouter } from "next/navigation";

const MONTHS = ["2025-01", "2025-02"];

const DAILY_MOCK = [
  { date: "1/1",  posts: 3, winRate: 0.55, accuracy: 0.62, scorePrecision: 0.58 },
  { date: "1/2",  posts: 5, winRate: 0.60, accuracy: 0.66, scorePrecision: 0.61 },
  { date: "1/3",  posts: 2, winRate: 0.50, accuracy: 0.58, scorePrecision: 0.55 },
  { date: "1/4",  posts: 6, winRate: 0.68, accuracy: 0.70, scorePrecision: 0.65 },
  { date: "1/5",  posts: 4, winRate: 0.63, accuracy: 0.69, scorePrecision: 0.64 },
  { date: "1/6",  posts: 5, winRate: 0.61, accuracy: 0.67, scorePrecision: 0.62 },
  { date: "1/7",  posts: 3, winRate: 0.57, accuracy: 0.63, scorePrecision: 0.59 },
  { date: "1/8",  posts: 4, winRate: 0.59, accuracy: 0.65, scorePrecision: 0.60 },
  { date: "1/9",  posts: 6, winRate: 0.66, accuracy: 0.71, scorePrecision: 0.66 },
  { date: "1/10", posts: 2, winRate: 0.52, accuracy: 0.60, scorePrecision: 0.56 },
  { date: "1/11", posts: 5, winRate: 0.62, accuracy: 0.68, scorePrecision: 0.63 },
  { date: "1/12", posts: 4, winRate: 0.60, accuracy: 0.66, scorePrecision: 0.61 },
  { date: "1/13", posts: 6, winRate: 0.69, accuracy: 0.72, scorePrecision: 0.67 },
  { date: "1/14", posts: 3, winRate: 0.56, accuracy: 0.64, scorePrecision: 0.59 },
  { date: "1/15", posts: 5, winRate: 0.63, accuracy: 0.69, scorePrecision: 0.64 },
  { date: "1/16", posts: 4, winRate: 0.61, accuracy: 0.67, scorePrecision: 0.62 },
  { date: "1/17", posts: 2, winRate: 0.49, accuracy: 0.57, scorePrecision: 0.54 },
  { date: "1/18", posts: 6, winRate: 0.67, accuracy: 0.71, scorePrecision: 0.66 },
  { date: "1/19", posts: 5, winRate: 0.64, accuracy: 0.70, scorePrecision: 0.65 },
  { date: "1/20", posts: 3, winRate: 0.55, accuracy: 0.62, scorePrecision: 0.58 },
  { date: "1/21", posts: 4, winRate: 0.58, accuracy: 0.64, scorePrecision: 0.60 },
  { date: "1/22", posts: 6, winRate: 0.70, accuracy: 0.73, scorePrecision: 0.68 },
  { date: "1/23", posts: 5, winRate: 0.65, accuracy: 0.71, scorePrecision: 0.66 },
  { date: "1/24", posts: 2, winRate: 0.51, accuracy: 0.59, scorePrecision: 0.55 },
  { date: "1/25", posts: 4, winRate: 0.60, accuracy: 0.66, scorePrecision: 0.61 },
];

const MONTHLY_MOCK = [
  {
    month: "2025-01",
    posts: 124,
    winRate: 0.66,
    accuracy: 0.71,
    avgPrecision: 0.64,
    avgUpset: 0.52,
  },
  {
    month: "2025-02",
    posts: 98,
    winRate: 0.62,
    accuracy: 0.69,
    avgPrecision: 0.61,
    avgUpset: 0.48,
  },
];

const COMPARISON_USER_COUNT = 300;
const COMPARISON_TOP10_USER_COUNT = 120;

export default function ProPreviewPage() {
  const router = useRouter();
  const [month, setMonth] = useState("2025-01");
  const [pressed, setPressed] = useState(false);

  // Web or Mobile 判定
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768); // 768px 以下で Mobile と判定
  }, []);

  const handleProClick = () => {
    if (isMobile) {
      router.push("/mobile/pro/subscribe");
    } else {
      router.push("/web/pro/subscribe");
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2 mt-6">
  <p className="text-xs text-white/60 text-center">
    ※ この分析は有料プラン限定です
  </p>

  <div
    role="button"
    tabIndex={0}
    onClick={handleProClick}
onKeyDown={(e) => { if (e.key === "Enter") handleProClick(); }}
    onPointerDown={() => setPressed(true)}
    onPointerUp={() => setPressed(false)}
    onPointerLeave={() => setPressed(false)}
    style={{
  background: "linear-gradient(90deg, #F59E0B, #F97316)", // ← オレンジに変更
  color: "#fff",
  padding: "13px 20px",
  borderRadius: "14px",
  fontWeight: 800,
  fontSize: "14px",
  boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
  cursor: "pointer",
  transition: "transform 0.12s ease",
  transform: pressed ? "scale(0.94)" : "scale(1)",
  width: "220px",
  maxWidth: "90%",
  textAlign: "center",
}}
  >
    Proで全データを見る
  </div>
</div>

      <ProAnalysisView
  isSample
  month={month}
  months={MONTHS}
  onChangeMonth={setMonth}
  radar={{
    winRate: 7,
    accuracy: 8,
    precision: 6,
    upset: 5,
    volume: 9,
    upsetValid: true, // ★ 追加（Preview なので true 固定でOK）
  }}
        analysisTypeId="COMPLETE_PLAYER"
        percentiles={{
          winRate: 92,
          accuracy: 88,
          precision: 74,
          upset: 61,
          volume: 97,
        }}
        comparisonRows={[
          { label: "投稿数", format: (v: number) => `${v}`, self: 42, avg: 18, top10: 61 },
          { label: "勝率", format: (v: number) => `${Math.round(v * 100)}%`, self: 0.66, avg: 0.54, top10: 0.72 },
          { label: "予測精度", format: (v: number) => `${Math.round(v * 100)}%`, self: 0.68, avg: 0.61, top10: 0.78 },
          { label: "スコア精度", format: (v: number) => `${Math.round(v * 100)}%`, self: 0.71, avg: 0.63, top10: 0.78 },
          { label: "Upset的中率", format: (v: number) => v.toFixed(2), self: 0.52, avg: 0.31, top10: 0.60 },
        ]}
        comparisonUserCount={COMPARISON_USER_COUNT}
        comparisonTop10UserCount={COMPARISON_TOP10_USER_COUNT}
        homeAway={{ homeRate: 0.71, awayRate: 0.58 }}
        teamAffinity={{
          strong: [
            { teamId: "lal", teamName: "Lakers", games: 8, winRate: 0.75 },
            { teamId: "bos", teamName: "Celtics", games: 6, winRate: 0.67 },
            { teamId: "mil", teamName: "Bucks", games: 5, winRate: 0.6 },
          ],
          weak: [
            { teamId: "den", teamName: "Nuggets", games: 7, winRate: 0.29 },
            { teamId: "mia", teamName: "Heat", games: 5, winRate: 0.4 },
            { teamId: "phx", teamName: "Suns", games: 4, winRate: 0.5 },
          ],
        }}
        dailyTrend={DAILY_MOCK}
        monthlyTrend={MONTHLY_MOCK}
      />

      <div className="flex flex-col items-center gap-2 mt-6">
  <p className="text-xs text-white/60 text-center">
    ※ この分析は有料プラン限定です
  </p>

  <div
    role="button"
    tabIndex={0}
    onClick={handleProClick}
onKeyDown={(e) => { if (e.key === "Enter") handleProClick(); }}
    onPointerDown={() => setPressed(true)}
    onPointerUp={() => setPressed(false)}
    onPointerLeave={() => setPressed(false)}
    style={{
  background: "linear-gradient(90deg, #F59E0B, #F97316)", // ← オレンジに変更
  color: "#fff",
  padding: "13px 20px",
  borderRadius: "14px",
  fontWeight: 800,
  fontSize: "14px",
  boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
  cursor: "pointer",
  transition: "transform 0.12s ease",
  transform: pressed ? "scale(0.94)" : "scale(1)",
  width: "220px",
  maxWidth: "90%",
  textAlign: "center",
}}
  >
    Proで全データを見る
  </div>
</div>
    </>
  );
}
