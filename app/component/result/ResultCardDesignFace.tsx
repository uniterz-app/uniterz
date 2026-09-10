"use client";

/**
 * Native `ResultCardDesignFaceNative` 相当 — リザルトの新カード面（判定前含む）。
 */
import { Check, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { MouseEvent } from "react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import MatchListLineFrame from "@/app/component/games/MatchListLineFrame";
import {
  GAMES_CYBER_EASE,
  GAMES_CYBER_ENTRY_DURATION_SEC,
  GAMES_CYBER_GROUP_GAP_SEC,
  GAMES_LINE_FRAME_DRAW_SEC,
} from "@/app/component/games/cyberMotion";
import { nameBebas, nameOxanium, matchScoreClass } from "@/lib/fonts";
import {
  resultOutcomeLineFramePaint,
  resultPendingLineFramePaint,
} from "@/lib/games/matchListLineFrame";
import type { ResultCardFaceModel } from "@/lib/result/buildResultCardFace";
import type { ResultScoreRelKind } from "@/lib/result/resultScoreRelative";
import ResultImpactStreakTag from "@/app/component/result/ResultImpactStreakTag";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
  resolveMatchupUiAccents,
} from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import type { Language } from "@/lib/i18n/language";
import { resultCardFaceCopy } from "@/lib/result/resultCardFaceCopy";
import styles from "./resultCardDesignFace.module.css";

const OUTCOME_LABEL = {
  hit: "HIT",
  perfect: "PERFECT",
  upset: "UPSET",
  miss: "MISS",
} as const;

const OUTCOME_TONE = {
  hit: "#FCD34D",
  perfect: "#3B82F6",
  upset: "#DC2626",
  miss: "#94A3B8",
} as const;

const RESULT_LINE_FRAME_PAINT = {
  hit: resultOutcomeLineFramePaint("hit")!,
  perfect: resultOutcomeLineFramePaint("perfect")!,
  upset: resultOutcomeLineFramePaint("upset")!,
  miss: resultOutcomeLineFramePaint("miss")!,
} as const;

const RESULT_PENDING_LINE_FRAME_PAINT = resultPendingLineFramePaint();
const LIVE_TONE = "#00F5FF";

const BIAS_SEGS = 16;
const BIAS_SEG_STAGGER_MS = 32;
const RESULT_FACE_AFTER_FRAME_PAD_SEC = 0.08;

type OutcomeBadge = keyof typeof OUTCOME_LABEL;

function scoreRelText(kind: ResultScoreRelKind): string | null {
  if (kind === "max") return "#1";
  if (kind === "top5") return "TOP 5%";
  if (kind === "top10") return "TOP 10%";
  return null;
}

function hexWithAlpha(hex: string, alphaHex: string): string {
  const n = hex.startsWith("#") ? hex : `#${hex}`;
  if (n.length === 9) return n;
  return `${n}${alphaHex}`;
}

function faceGroupDelaySec(drawDelaySec: number, group: 0 | 1 | 2) {
  return (
    Math.max(0, drawDelaySec) +
    GAMES_LINE_FRAME_DRAW_SEC +
    RESULT_FACE_AFTER_FRAME_PAD_SEC +
    group * GAMES_CYBER_GROUP_GAP_SEC
  );
}

function ImpactTag({ label, color }: { label: string; color: string }) {
  return (
    <span className={styles.impactWrap}>
      <span className={`${styles.impactText} ${matchScoreClass}`} style={{ color }}>
        {label}
      </span>
      <span className={styles.impactSlash} style={{ backgroundColor: color }} />
    </span>
  );
}

type Props = {
  language?: Language;
  face: ResultCardFaceModel;
  /** true: カード右下に ›（詳細へ） */
  showDetailTab?: boolean;
  animateDraw?: boolean;
  drawDelaySec?: number;
  onOpen?: (e: MouseEvent<HTMLDivElement>) => void;
  /** 開始〜確定まで。判定前カードの LIVE 表示 */
  live?: boolean;
};

export default function ResultCardDesignFace({
  language = "ja",
  face,
  showDetailTab = false,
  animateDraw = false,
  drawDelaySec = 0,
  onOpen,
  live = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const copy = resultCardFaceCopy(language);
  const ja = language === "ja";
  const settled =
    face.resultHome != null && face.resultAway != null;
  const badge: OutcomeBadge | null = settled
    ? (face.outcomeBadge ?? "miss")
    : null;
  const paint = badge
    ? RESULT_LINE_FRAME_PAINT[badge]
    : RESULT_PENDING_LINE_FRAME_PAINT;
  const league = normalizeLeague(face.league);
  const homeJerseyPrimary =
    getTeamJerseyPrimaryColor(league, face.homeTeamId) ?? "#EF4444";
  const awayJerseyPrimary =
    getTeamJerseyPrimaryColor(league, face.awayTeamId) ?? "#C8CDD4";
  const homeSecondary =
    getTeamJerseySecondaryColor(league, face.homeTeamId) ?? homeJerseyPrimary;
  const awaySecondary =
    getTeamJerseySecondaryColor(league, face.awayTeamId) ?? awayJerseyPrimary;
  /** 市場バーは試合カードと同じ同系色解決（黒潰し・赤対決など） */
  const matchupAccents = resolveMatchupUiAccents(
    league,
    face.homeTeamId,
    face.awayTeamId
  );
  const homeAccent = matchupAccents.homeAccent;
  const awayAccent = matchupAccents.awayAccent;
  const showStreak = settled && face.winStreak >= 3;
  const homeSegs = Math.max(
    0,
    Math.min(BIAS_SEGS, Math.round((face.marketHomePct / 100) * BIAS_SEGS))
  );
  const shouldDraw = animateDraw && !reduceMotion;
  const headerDelay = faceGroupDelaySec(drawDelaySec, 0);
  const teamsDelay = faceGroupDelaySec(drawDelaySec, 1);
  const footerDelay = faceGroupDelaySec(drawDelaySec, 2);
  const biasRevealMs = Math.round((footerDelay + 0.06) * 1000);
  const groupMotion = (delay: number, dy = 8) =>
    shouldDraw
      ? {
          initial: { opacity: 0, y: dy },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: GAMES_CYBER_ENTRY_DURATION_SEC,
            delay,
            ease: GAMES_CYBER_EASE,
          },
        }
      : { initial: false as const, animate: { opacity: 1, y: 0 } };

  const rel = settled ? scoreRelText(face.scoreRel) : null;
  const relHot = face.scoreRel === "max" || face.scoreRel === "top5";
  const hasUpset = settled && face.upsetPoints != null;
  const upsetValue = hasUpset ? face.upsetPoints!.toFixed(1) : "--";
  const scoreValue = settled ? face.totalPoints.toFixed(1) : "--";
  const mainHome = settled ? (face.resultHome ?? 0) : face.predHome;
  const mainAway = settled ? (face.resultAway ?? 0) : face.predAway;
  const statusLabel = settled
    ? "FINAL"
    : live
      ? "LIVE"
      : copy.pendingCall;
  const showTopBar = showStreak || Boolean(badge);
  const scorerHit = face.topScorerHit === true;
  const showScorerOutcome = settled && face.topScorerHit != null;

  return (
    <div className={styles.wrap}>
      <MatchListLineFrame
      topLabel={face.roundLabel}
      paint={paint}
      animateDraw={shouldDraw}
      drawDelaySec={drawDelaySec}
      fadeContent={shouldDraw}
      onClick={onOpen}
      className={onOpen ? "cursor-pointer select-none" : undefined}
    >
      <div className={styles.body}>
        {showDetailTab ? (
          <span className={styles.detailHint} aria-hidden>
            <span className={`${styles.detailHintLabel} ${nameOxanium.className}`}>
              DETAIL
            </span>
            <span className={`${styles.detailHintChevron} ${nameOxanium.className}`}>
              ›
            </span>
          </span>
        ) : null}
        <div className={styles.pad}>
          {showTopBar ? (
          <motion.div className={styles.topBar} {...groupMotion(headerDelay, 6)}>
            <div className={styles.topLeftSlot}>
              {showStreak ? (
                <ResultImpactStreakTag winStreak={face.winStreak} />
              ) : null}
            </div>
            <div className={styles.topBadgeSlot}>
              {badge ? (
                <ImpactTag
                  label={OUTCOME_LABEL[badge]}
                  color={OUTCOME_TONE[badge]}
                />
              ) : live ? (
                <ImpactTag label="LIVE" color={LIVE_TONE} />
              ) : null}
            </div>
          </motion.div>
          ) : null}

          <motion.div className={styles.matchRow} {...groupMotion(teamsDelay, 10)}>
            <div className={styles.matchSide}>
              <span className={`${styles.homeAwayLabel} ${nameOxanium.className}`}>
                HOME
              </span>
              <HalftoneJerseyMark
                accent={homeJerseyPrimary}
                accentEnd={homeSecondary}
                className="h-[42px] w-[42px] shrink-0"
                glow="soft"
                density="coarse"
              />
              <span className={styles.skewWrap}>
                <span className={`${styles.teamNameSlant} ${nameOxanium.className} font-semibold`}>
                  {face.homeName}
                </span>
              </span>
            </div>

            <div className={styles.matchCenter}>
              <span className={styles.skewWrap}>
                <span
                  className={`${styles.finalStatus} ${
                    !settled && !live && ja
                      ? styles.finalStatusJa
                      : nameBebas.className
                  }`}
                  style={live && !settled ? { color: LIVE_TONE } : undefined}
                >
                  {statusLabel}
                </span>
              </span>
              <span
                className={`${settled ? styles.finalScore : styles.predScoreMain} ${matchScoreClass}`}
              >
                {mainHome}
                <span className={settled ? styles.finalDash : styles.predDash}>
                  {" "}
                  —{" "}
                </span>
                {mainAway}
              </span>
              {settled ? (
                <>
                  <span className={styles.predCaption}>
                    {copy.pendingCall}
                  </span>
                  <span className={`${styles.predScore} ${matchScoreClass}`}>
                    {face.predHome}
                    <span className={styles.predDash}> — </span>
                    {face.predAway}
                  </span>
                </>
              ) : null}
            </div>

            <div className={styles.matchSide}>
              <span className={`${styles.homeAwayLabel} ${nameOxanium.className}`}>
                AWAY
              </span>
              <HalftoneJerseyMark
                accent={awayJerseyPrimary}
                accentEnd={awaySecondary}
                className="h-[42px] w-[42px] shrink-0"
                glow="soft"
                density="coarse"
              />
              <span className={styles.skewWrap}>
                <span className={`${styles.teamNameSlant} ${nameOxanium.className} font-semibold`}>
                  {face.awayName}
                </span>
              </span>
            </div>
          </motion.div>

          <motion.div
            className={styles.layerDivider}
            {...(shouldDraw
              ? {
                  initial: { opacity: 0, scaleX: 0.2 },
                  animate: { opacity: 1, scaleX: 1 },
                  transition: {
                    duration: GAMES_CYBER_ENTRY_DURATION_SEC,
                    delay: teamsDelay + GAMES_CYBER_ENTRY_DURATION_SEC * 0.4,
                    ease: GAMES_CYBER_EASE,
                  },
                }
              : {})}
          />

          <motion.div {...groupMotion(footerDelay, 8)}>
            <div className={styles.biasRoot}>
              <div className={styles.biasPctHeader}>
                <span
                  className={`${styles.biasPctHeaderNum} ${nameOxanium.className}`}
                  style={{ color: homeAccent }}
                >
                  {face.marketHomePct.toFixed(1)}%
                </span>
                <span
                  className={`${styles.biasPctHeaderMid} ${nameOxanium.className}`}
                >
                  — {copy.marketBias} —
                </span>
                <span
                  className={`${styles.biasPctHeaderNum} ${styles.biasPctHeaderNumAway} ${nameOxanium.className}`}
                  style={{ color: awayAccent }}
                >
                  {face.marketAwayPct.toFixed(1)}%
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
                          className={[
                            styles.biasSegFace,
                            shouldDraw ? styles.biasSegFaceAnimate : "",
                          ].join(" ")}
                          style={{
                            borderColor: hexWithAlpha(accent, "88"),
                            backgroundColor: accent,
                            opacity: shouldDraw ? undefined : op,
                            ["--seg-op" as string]: op,
                            ["--seg-delay" as string]: `${
                              biasRevealMs + i * BIAS_SEG_STAGGER_MS
                            }ms`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.statBlock}>
              {face.topScorer && face.topScorer !== "—" ? (
                <div className={styles.scorerBlock}>
                  <div className={styles.scorerValueRow}>
                    <span className={styles.skewWrap}>
                      <span
                        className={`${styles.scorerLabel} ${nameOxanium.className}`}
                      >
                        TOP SCORER
                      </span>
                    </span>
                    <div className={styles.scorerNameWrap}>
                      <span className={styles.scorerNameSkew}>
                        <span
                          className={`${styles.scorerName} ${nameOxanium.className}`}
                        >
                          {face.topScorer}
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
                      {upsetValue}
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
                      className={`${styles.splitValue} ${styles.splitValueScore} ${matchScoreClass}`}
                    >
                      {scoreValue}
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
          </motion.div>
        </div>
      </div>
      </MatchListLineFrame>
    </div>
  );
}
