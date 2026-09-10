"use client";

/**
 * リザルトカード面と同じ市場偏り / TOP SCORER / Upset·Score。
 * 予想オーバーレイ（試合カード）用。
 */
import { Check, X } from "lucide-react";
import { nameOxanium, matchScoreClass } from "@/lib/fonts";
import { resultCardFaceCopy } from "@/lib/result/resultCardFaceCopy";
import type { Language } from "@/lib/i18n/language";
import styles from "./resultCardDesignFace.module.css";

const BIAS_SEGS = 16;

function hexWithAlpha(hex: string, alphaHex: string): string {
  const n = hex.startsWith("#") ? hex : `#${hex}`;
  if (n.length === 9) return n;
  return `${n}${alphaHex}`;
}

export default function ResultCardOverlayFooter({
  language,
  /** @deprecated use language */
  ja,
  homePct,
  awayPct,
  homeAccent,
  awayAccent,
  topScorer,
  topScorerHit = null,
  settled = false,
  upsetPoints = null,
  totalPoints = null,
  scoreRel = null,
  predictionCount = null,
  predictionCountLabel,
}: {
  language?: Language | "ja" | "en";
  /** @deprecated use language */
  ja?: boolean;
  homePct: number;
  awayPct: number;
  homeAccent: string;
  awayAccent: string;
  topScorer?: string | null;
  topScorerHit?: boolean | null;
  settled?: boolean;
  upsetPoints?: number | null;
  totalPoints?: number | null;
  scoreRel?: "max" | "top5" | "top10" | null;
  predictionCount?: number | null;
  predictionCountLabel?: string;
}) {
  const copy = resultCardFaceCopy(
    language ?? (ja === false ? "en" : "ja")
  );
  const homeSegs = Math.max(
    0,
    Math.min(BIAS_SEGS, Math.round((homePct / 100) * BIAS_SEGS))
  );
  const hasUpset = settled && upsetPoints != null;
  const showScorer = Boolean(topScorer && topScorer !== "—");
  const showScorerOutcome = settled && topScorerHit != null;
  const scorerHit = topScorerHit === true;
  const showCount =
    typeof predictionCount === "number" &&
    Number.isFinite(predictionCount) &&
    predictionCount >= 0;
  const countLabel = predictionCountLabel ?? copy.totalPredictions;
  const rel =
    settled && scoreRel
      ? scoreRel === "max"
        ? "#1"
        : scoreRel === "top5"
          ? "TOP 5%"
          : "TOP 10%"
      : null;
  const relHot = scoreRel === "max" || scoreRel === "top5";

  return (
    <div>
      <div className={styles.layerDivider} />
      <div className={styles.biasRoot}>
        <div className={styles.biasPctHeader}>
          <span
            className={`${styles.biasPctHeaderNum} ${nameOxanium.className}`}
            style={{ color: homeAccent }}
          >
            {homePct.toFixed(1)}%
          </span>
          <div className={styles.biasPctHeaderMidCol}>
            <span
              className={`${styles.biasPctHeaderMid} ${nameOxanium.className}`}
            >
              — {copy.marketBias} —
            </span>
            {showCount ? (
              <span
                className={`${styles.biasCount} ${nameOxanium.className}`}
              >
                {countLabel}
                <span className={styles.biasCountNum}>
                  {Math.floor(predictionCount)}
                </span>
              </span>
            ) : null}
          </div>
          <span
            className={`${styles.biasPctHeaderNum} ${styles.biasPctHeaderNumAway} ${nameOxanium.className}`}
            style={{ color: awayAccent }}
          >
            {awayPct.toFixed(1)}%
          </span>
        </div>
        <div className={styles.biasBarInner}>
          {Array.from({ length: BIAS_SEGS }).map((_, i) => {
            const home = i < homeSegs;
            const accent = home ? homeAccent : awayAccent;
            const op = home ? 0.95 : 0.85;
            return (
              <div key={i} className={styles.biasSegSlot}>
                <div className={styles.biasSegSkew}>
                  <div
                    className={styles.biasSegFace}
                    style={{
                      borderColor: hexWithAlpha(accent, "88"),
                      backgroundColor: accent,
                      opacity: op,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.statBlock}>
        {showScorer ? (
          <div className={styles.scorerBlock}>
            <div className={styles.scorerValueRow}>
              <span className={styles.skewWrap}>
                <span className={`${styles.scorerLabel} ${nameOxanium.className}`}>
                  TOP SCORER
                </span>
              </span>
              <div className={styles.scorerNameWrap}>
                <span className={styles.scorerNameSkew}>
                  <span
                    className={`${styles.scorerName} ${nameOxanium.className}`}
                  >
                    {topScorer}
                  </span>
                </span>
              </div>
              {showScorerOutcome ? (
                <span className={styles.scorerHitCluster}>
                  {scorerHit ? (
                    <Check size={14} strokeWidth={2.6} color="#FBBF24" />
                  ) : (
                    <X
                      size={14}
                      strokeWidth={2.6}
                      color="rgba(148,163,184,0.55)"
                    />
                  )}
                  <span
                    className={[
                      styles.scorerHit,
                      nameOxanium.className,
                      scorerHit ? styles.scorerHitOn : styles.scorerHitOff,
                    ].join(" ")}
                  >
                    {scorerHit ? "HIT" : "MISS"}
                  </span>
                </span>
              ) : (
                <span className={styles.scorerHitCluster} />
              )}
            </div>
          </div>
        ) : null}

        <div className={styles.splitRow}>
          <div
            className={[
              styles.splitSide,
              !hasUpset ? styles.splitSideMuted : "",
            ].join(" ")}
          >
            <span className={`${styles.splitLabel} ${nameOxanium.className}`}>
              {copy.upset}
            </span>
            <span className={styles.skewWrap}>
              <span
                className={[
                  styles.splitValue,
                  matchScoreClass,
                  hasUpset ? styles.splitValueUpset : styles.splitValueEmpty,
                ].join(" ")}
              >
                {hasUpset ? upsetPoints!.toFixed(1) : "--"}
              </span>
            </span>
            <span className={styles.splitRelSpacer}> </span>
          </div>
          <div className={styles.splitRule} />
          <div className={styles.splitSide}>
            <span className={`${styles.splitLabel} ${nameOxanium.className}`}>
              {copy.score}
            </span>
            <span className={styles.skewWrap}>
              <span
                className={[
                  styles.splitValue,
                  matchScoreClass,
                  styles.splitValueScore,
                ].join(" ")}
              >
                {settled && totalPoints != null
                  ? totalPoints.toFixed(1)
                  : "--"}
              </span>
            </span>
            {rel ? (
              <span
                className={[
                  styles.splitRel,
                  nameOxanium.className,
                  relHot ? styles.splitRelHot : "",
                ].join(" ")}
              >
                {rel}
              </span>
            ) : (
              <span className={styles.splitRelSpacer}> </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
