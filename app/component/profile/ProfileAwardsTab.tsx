"use client";

/**
 * プロフィール「アワード」タブ — 提出済みシーズン予想（アワード + 順位）。
 * 締切前かつ自分プロフィールなら未提出分の提出導線を出す。
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { isSeasonPredictSubmitOpen } from "@/lib/predict/seasonPredictDeadline";
import { nameOxanium } from "@/lib/fonts";
import type {
  NbaAwardCandidate,
  NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import type { NbaSeasonStandingsPrediction } from "@/lib/predict/nbaSeasonStandingsPredict";

type Props = {
  uid?: string | null;
  language?: string;
  /** 自分のプロフィールのときだけ提出 CTA を出す */
  isMe?: boolean;
  /** 明示指定時は awards fetch せずこれを表示（プレビュー用） */
  prediction?: NbaSeasonAwardsPrediction | null;
  candidates?: NbaAwardCandidate[];
  standings?: NbaSeasonStandingsPrediction | null;
  className?: string;
};

export default function ProfileAwardsTab({
  uid = null,
  language = "ja",
  isMe = false,
  prediction: predictionProp,
  candidates: candidatesProp,
  standings: standingsProp,
  className,
}: Props) {
  const router = useRouter();
  const copy = profileAwardsBracketCopy(language);
  const controlled =
    predictionProp !== undefined || standingsProp !== undefined;
  const canOfferSubmit = isMe && isSeasonPredictSubmitOpen() && !controlled;
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

  const goAwards = () => router.push("/mobile/season-awards");
  const goStandings = () => router.push("/mobile/season-standings");

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
        <p className="mt-2 max-w-[280px] text-center text-[11px] leading-snug text-white/40">
          {canOfferSubmit ? copy.submitOpenHint : copy.noSeasonPredictions}
        </p>
        {canOfferSubmit ? (
          <SubmitCtaRow
            showAwards
            showStandings
            awardsLabel={copy.submitAwardsCta}
            standingsLabel={copy.submitStandingsCta}
            onAwards={goAwards}
            onStandings={goStandings}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={["mt-4 space-y-6", className].filter(Boolean).join(" ")}
    >
      {standings ? (
        <NbaSeasonStandingsViewPanel prediction={standings} />
      ) : canOfferSubmit ? (
        <MissingSubmitCard
          hint={copy.missingStandingsHint}
          ctaLabel={copy.submitStandingsCta}
          onPress={goStandings}
        />
      ) : null}
      {prediction ? (
        <NbaSeasonAwardsViewPanel
          prediction={prediction}
          catalog={candidates.length > 0 ? candidates : undefined}
        />
      ) : canOfferSubmit ? (
        <MissingSubmitCard
          hint={copy.missingAwardsHint}
          ctaLabel={copy.submitAwardsCta}
          onPress={goAwards}
        />
      ) : null}
    </div>
  );
}

function SubmitCtaRow({
  showAwards,
  showStandings,
  awardsLabel,
  standingsLabel,
  onAwards,
  onStandings,
}: {
  showAwards: boolean;
  showStandings: boolean;
  awardsLabel: string;
  standingsLabel: string;
  onAwards: () => void;
  onStandings: () => void;
}) {
  return (
    <div className="mt-4 flex w-full max-w-[300px] flex-col gap-2">
      {showAwards ? (
        <SubmitButton label={awardsLabel} onPress={onAwards} />
      ) : null}
      {showStandings ? (
        <SubmitButton label={standingsLabel} onPress={onStandings} outline />
      ) : null}
    </div>
  );
}

function MissingSubmitCard({
  hint,
  ctaLabel,
  onPress,
}: {
  hint: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  return (
    <div
      className="grid place-items-center px-4 py-6 text-center"
      style={{
        borderRadius: 2,
        background: PROFILE_CHART_CYBER.rankPlotInnerBg,
        boxShadow: `inset 0 0 0 1px ${PROFILE_CHART_CYBER.glassBorder}`,
      }}
    >
      <p className="max-w-[280px] text-[11px] leading-snug text-white/45">{hint}</p>
      <div className="mt-3 w-full max-w-[280px]">
        <SubmitButton label={ctaLabel} onPress={onPress} />
      </div>
    </div>
  );
}

function SubmitButton({
  label,
  onPress,
  outline = false,
}: {
  label: string;
  onPress: () => void;
  outline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={[
        nameOxanium.className,
        "w-full touch-manipulation px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] transition active:opacity-90",
        outline
          ? "border border-[#00F5FF]/70 bg-transparent text-[#7DFAFF] hover:border-[#00F5FF]"
          : "border-2 border-[#00F5FF] bg-[#00F5FF] text-[#050508] hover:brightness-110",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
