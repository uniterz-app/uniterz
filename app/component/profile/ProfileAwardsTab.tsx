"use client";

/**
 * プロフィール「アワード」タブ — 提出済みシーズン予想（アワード + 順位）。
 */
import { useEffect, useState } from "react";
import NbaSeasonAwardsViewPanel from "@/app/component/predict/season/NbaSeasonAwardsViewPanel";
import NbaSeasonStandingsViewPanel from "@/app/component/predict/season/NbaSeasonStandingsViewPanel";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import { fetchProfileSeasonAwards } from "@/lib/api/fetchSeasonAwards";
import { fetchProfileSeasonStandings } from "@/lib/api/fetchSeasonStandings";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { CyberNoDataLabel } from "@/app/component/common/CyberNoDataLabel";
import { PROFILE_CHART_CYBER } from "@/lib/profile/profileOverviewChartCyberTheme";
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { profileAwardsBracketCopy } from "@/lib/profile/profileAwardsBracketCopy";
import type {
  NbaAwardCandidate,
  NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import type { NbaSeasonStandingsPrediction } from "@/lib/predict/nbaSeasonStandingsPredict";

type Props = {
  uid?: string | null;
  language?: string;
  /** 明示指定時は awards fetch せずこれを表示（プレビュー用） */
  prediction?: NbaSeasonAwardsPrediction | null;
  candidates?: NbaAwardCandidate[];
  standings?: NbaSeasonStandingsPrediction | null;
  className?: string;
};

export default function ProfileAwardsTab({
  uid = null,
  language = "ja",
  prediction: predictionProp,
  candidates: candidatesProp,
  standings: standingsProp,
  className,
}: Props) {
  const copy = profileAwardsBracketCopy(language);
  const controlled =
    predictionProp !== undefined || standingsProp !== undefined;
  const [loading, setLoading] = useState(!controlled && Boolean(uid));
  const [prediction, setPrediction] = useState<NbaSeasonAwardsPrediction | null>(
    predictionProp ?? null
  );
  const [candidates, setCandidates] = useState<NbaAwardCandidate[]>(
    candidatesProp ?? []
  );
  const [standings, setStandings] = useState<NbaSeasonStandingsPrediction | null>(
    standingsProp ?? null
  );

  useEffect(() => {
    if (controlled) {
      if (predictionProp !== undefined) {
        setPrediction(predictionProp ?? null);
        setCandidates(candidatesProp ?? []);
      }
      if (standingsProp !== undefined) {
        setStandings(standingsProp ?? null);
      }
      setLoading(false);
      return;
    }
    if (!uid) {
      setPrediction(null);
      setCandidates([]);
      setStandings(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [awardsRes, standingsRes] = await Promise.allSettled([
          fetchProfileSeasonAwards(uid, CURRENT_NBA_SEASON_KEY),
          fetchProfileSeasonStandings(uid, CURRENT_NBA_SEASON_KEY),
        ]);
        if (cancelled) return;
        if (awardsRes.status === "fulfilled") {
          setPrediction(awardsRes.value.prediction);
          setCandidates(awardsRes.value.candidates ?? []);
        } else {
          console.error("ProfileAwardsTab awards", awardsRes.reason);
          setPrediction(null);
          setCandidates([]);
        }
        if (standingsRes.status === "fulfilled") {
          setStandings(standingsRes.value.prediction);
        } else {
          console.error("ProfileAwardsTab standings", standingsRes.reason);
          setStandings(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, controlled, predictionProp, candidatesProp, standingsProp]);

  if (loading) {
    return (
      <div
        className={[CYBER_GLASS_PANEL, "mt-4 flex justify-center p-6", className]
          .filter(Boolean)
          .join(" ")}
      >
        <CandleChartLoader />
      </div>
    );
  }

  if (!prediction && !standings) {
    return (
      <div
        role="status"
        className={[
          "mt-4 grid min-h-[180px] place-items-center px-4 py-10 text-center",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          borderRadius: 2,
          background: PROFILE_CHART_CYBER.rankPlotInnerBg,
          boxShadow: `inset 0 0 0 1px ${PROFILE_CHART_CYBER.glassBorder}`,
        }}
      >
        <CyberNoDataLabel variant="progress" />
        <p className="mt-2 max-w-[260px] text-center text-[11px] leading-snug text-white/40">
          {copy.noSeasonPredictions}
        </p>
      </div>
    );
  }

  return (
    <div
      className={["mt-4 space-y-6", className].filter(Boolean).join(" ")}
    >
      {standings ? (
        <NbaSeasonStandingsViewPanel prediction={standings} />
      ) : null}
      {prediction ? (
        <NbaSeasonAwardsViewPanel
          prediction={prediction}
          catalog={candidates.length > 0 ? candidates : undefined}
        />
      ) : null}
    </div>
  );
}
