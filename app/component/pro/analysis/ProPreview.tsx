"use client";

import { useState, useEffect } from "react";
import ProAnalysisView from "@/app/component/pro/analysis/ProAnalysisView";
import { useRouter } from "next/navigation";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

const MONTHS = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];

const COMPARISON_USER_COUNT = 300;
const COMPARISON_TOP10_USER_COUNT = 120;

export default function ProPreviewPage() {
  const router = useRouter();
  const { language } = useUserLanguage(null);
  const [month, setMonth] = useState("2025-01");
  const [pressed, setPressed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const postsLabel = language === "en" ? "Posts" : "投稿数";
  const winRateLabel = language === "en" ? "Win Rate" : "勝率";
  const scorePrecisionLabel =
    language === "en" ? "Score Precision" : "スコア精度";
  const totalPointsLabel =
    language === "en" ? "Total Points" : "総合得点";
  const upsetIndexLabel =
    language === "en" ? "Upset Index" : "Upset指数";

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  const handleProClick = () => {
    router.push(isMobile ? "/mobile/pro/subscribe" : "/web/pro/subscribe");
  };

  return (
    <>
      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-center text-xs text-white/60">
          {language === "en"
            ? "This analysis is available for paid plans only."
            : "※ この分析は有料プラン限定です"}
        </p>
        <div
          role="button"
          tabIndex={0}
          onClick={handleProClick}
          onKeyDown={(e) => e.key === "Enter" && handleProClick()}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          style={{
            background: "linear-gradient(90deg, #F59E0B, #F97316)",
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
          {language === "en" ? "View all Pro data" : "Proで全データを見る"}
        </div>
      </div>

      <ProAnalysisView
        isSample
        month={month}
        months={MONTHS}
        onChangeMonth={setMonth}
        radar={{
          winRate: 7,
          precision: 6,
          upset: 5,
          volume: 9,
          streak: 6,
          upsetValid: true,
        }}
        analysisTypeId="COMPLETE_PLAYER"
        percentiles={{
          winRate: 92,
          precision: 74,
          pointsV3: 81,
          upset: 61,
          volume: 97,
        }}
        streak={{ maxWin: 10, maxLose: 6 }}
        prevStreak={{ maxWin: 4, maxLose: 5 }}
        comparisonRows={[
          {
            label: postsLabel,
            format: (v: number) => `${v}`,
            self: 42,
            avg: 18,
            top10: 61,
          },
          {
            label: winRateLabel,
            format: (v: number) => `${Math.round(v * 100)}%`,
            self: 0.66,
            avg: 0.54,
            top10: 0.72,
          },

          {
            label: scorePrecisionLabel,
            format: (v: number) => `${Math.round(v * 100)}%`,
            self: 0.71,
            avg: 0.63,
            top10: 0.78,
          },
          {
            label: totalPointsLabel,
            format: (v: number) => v.toFixed(1),
            self: 8.4,
            avg: 5.9,
            top10: 9.2,
          },
          {
            label: upsetIndexLabel,
            format: (v: number) => v.toFixed(2),
            self: 4.8,
            avg: 2.3,
            top10: 6.1,
          },
        ]}
        comparisonUserCount={COMPARISON_USER_COUNT}
        comparisonTop10UserCount={COMPARISON_TOP10_USER_COUNT}
        homeAway={{
          homeRate: 0.71,
          awayRate: 0.58,
          homeShare: 0.55,
          awayShare: 0.45,
        }}
        marketBias={{
          favorableWinRate: 0.68,
          contrarianWinRate: 0.57,
          favorableShare: 0.62,
          contrarianShare: 0.38,
        }}
        styleMapPoints={[
          {
            homeAwayBias: 0.35,
            marketBias: -0.2,
            winRate: 0.66,
            key: month,
          },
        ]}
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
      />

      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-center text-xs text-white/60">
          ※ この分析は有料プラン限定です
        </p>
        <div
          role="button"
          tabIndex={0}
          onClick={handleProClick}
          onKeyDown={(e) => e.key === "Enter" && handleProClick()}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          style={{
            background: "linear-gradient(90deg, #F59E0B, #F97316)",
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