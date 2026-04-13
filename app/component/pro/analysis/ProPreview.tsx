"use client";

import { useState, useEffect } from "react";
import ProAnalysisView from "@/app/component/pro/analysis/ProAnalysisView";
import type { RadarAxisLevels } from "@/app/component/pro/analysis/radarLevelUtils";
import { useRouter } from "next/navigation";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

const MONTHS = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];

const PREVIEW_RADAR_LEVELS: RadarAxisLevels = {
  winRate: "M",
  precision: "M",
  upset: "M",
  volume: "S",
  streak: "M",
};

export default function ProPreviewPage() {
  const router = useRouter();
  const { language } = useUserLanguage(null);
  const [month, setMonth] = useState("2026-01");
  const [pressed, setPressed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
        language={language === "en" ? "en" : "ja"}
        prevMonthSummary={{
          monthKey: "2025-12",
          stats: {
            raw: {
              posts: 38,
              wins: 24,
              winRate: 24 / 38,
              avgPrecision: 6.2,
              avgPointsV3: 7.85,
              scorePrecisionSum: 6.2 * 38,
              pointsSumV3: 7.85 * 38,
              basePointsSum: 240,
              upsetBonusSum: 42,
              streakBonusSum: 16.3,
              upsetPointsSum: 4.2,
              upsetHit: 5,
              pointsSumV3Rank: 12,
              leaguePosts: { nba: 25, bj: 13 },
            },
            percentiles: {
              winRate: 88,
              precision: 71,
              pointsV3: 79,
              upset: 58,
              volume: 92,
            },
          },
          olderStats: {
            raw: {
              posts: 29,
              wins: 16,
              winRate: 16 / 29,
              avgPrecision: 5.9,
              avgPointsV3: 6.4,
              scorePrecisionSum: 5.9 * 29,
              pointsSumV3: 6.4 * 29,
              basePointsSum: 168,
              upsetBonusSum: 12,
              streakBonusSum: 5.6,
              upsetPointsSum: 3.1,
              upsetHit: 3,
            },
            percentiles: {
              winRate: 72,
              precision: 65,
              pointsV3: 61,
              upset: 52,
              volume: 81,
            },
          },
        }}
        prevMonthPointsSumBenchmarks={{
          mean: 172.4,
          median: 154.8,
          p90: 398.2,
          max: 881.0,
        }}
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
          radarEligible: true,
        }}
        radarAxisLevels={PREVIEW_RADAR_LEVELS}
        analysisTypeId="COMPLETE_PLAYER"
        streak={{ maxWin: 10, maxLose: 6 }}
        prevStreak={{ maxWin: 4, maxLose: 5 }}
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