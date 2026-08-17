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
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import type {
  NbaAwardCandidate,
  NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import type { NbaSeasonStandingsPrediction } from "@/lib/predict/nbaSeasonStandingsPredict";

type Props = {
  uid?: string | null;
  language?: "ja" | "en";
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
  const isJa = language === "ja";
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
        className={[
          "mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-7 text-center",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <CyberNoDataLabel variant="awards" />
        <p className="text-sm text-white/45">
          {isJa
            ? "提出済みのシーズン予想がありません"
            : "No season predictions submitted"}
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
