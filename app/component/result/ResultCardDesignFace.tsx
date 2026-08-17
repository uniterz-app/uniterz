"use client";

/**
 * Native `ResultCardDesignFaceNative` 相当 — 確定済みリザルトの新カード面。
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
import { resultOutcomeLineFramePaint } from "@/lib/games/matchListLineFrame";
import type { ResultCardFaceModel } from "@/lib/result/buildResultCardFace";
import type { ResultScoreRelKind } from "@/lib/result/resultScoreRelative";
import { streakTagTone } from "@/lib/result/streakTagTone";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import type { Language } from "@/lib/i18n/language";
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

const BIAS_SEGS = 16;
const BIAS_SEG_STAGGER_MS = 32;
const RESULT_FACE_AFTER_FRAME_PAD_SEC = 0.08;

/** Native `RESULT_CARD_DETAIL_SPINE` — 右辺 DETAIL タブ */
const RESULT_CARD_DETAIL_SPINE = {
  width: 18,
  height: 80,
  top: 80,
} as const;

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
  showDetailTab?: boolean;
  animateDraw?: boolean;
  drawDelaySec?: number;
  onOpen?: (e: MouseEvent<HTMLDivElement>) => void;
};

export default function ResultCardDesignFace({
  language = "ja",
  face,
  showDetailTab = false,
  animateDraw = false,
  drawDelaySec = 0,
  onOpen,
}: Props) {
  const reduceMotion = useReducedMotion();
  const ja = language === "ja";
  const badge: OutcomeBadge = face.outcomeBadge ?? "miss";
  const paint = RESULT_LINE_FRAME_PAINT[badge];
  const league = normalizeLeague(face.league);
  const homeAccent =
    getTeamJerseyPrimaryColor(league, face.homeTeamId) ?? "#EF4444";
  const awayAccent =
    getTeamJerseyPrimaryColor(league, face.awayTeamId) ?? "#C8CDD4";
  const homeSecondary =
    getTeamJerseySecondaryColor(league, face.homeTeamId) ?? homeAccent;
  const awaySecondary =
    getTeamJerseySecondaryColor(league, face.awayTeamId) ?? awayAccent;
  const showStreak = face.winStreak >= 3;
  const homeSegs = Math.max(1, Math.round((face.marketHomePct / 100) * BIAS_SEGS));
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

  const rel = scoreRelText(face.scoreRel);
  const relHot = face.scoreRel === "max" || face.scoreRel === "top5";
  const hasUpset = face.upsetPoints != null;
  const upsetValue = hasUpset ? face.upsetPoints!.toFixed(1) : "--";
  const resultHome = face.resultHome ?? 0;
  const resultAway = face.resultAway ?? 0;
  const scorerHit = face.topScorerHit === true;

  return (
    <div
      className={
        showDetailTab ? `${styles.wrap} ${styles.wrapWithDetail}` : styles.wrap
      }
    >
      <MatchListLineFrame
      topLabel={face.roundLabel}
      paint={paint}
      animateDraw={shouldDraw}
      drawDelaySec={drawDelaySec}
      fadeContent={shouldDraw}
      onClick={onOpen}
      className={onOpen ? "cursor-pointer select-none" : undefined}
    >
      {showDetailTab ? (
        <div
          className={styles.detailSpine}
          style={{
            top: RESULT_CARD_DETAIL_SPINE.top,
            right: -(RESULT_CARD_DETAIL_SPINE.width - 1),
            width: RESULT_CARD_DETAIL_SPINE.width,
            height: RESULT_CARD_DETAIL_SPINE.height,
            borderWidth: 1.5,
            borderColor: paint.color,
          }}
          aria-hidden
        >
          <div className={`${styles.detailSpineTextCol} ${nameOxanium.className}`}>
            {"DETAIL".split("").map((ch) => (
              <span key={ch} className={styles.detailSpineChar}>
                {ch}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.body}>
        <div className={styles.pad}>
          <motion.div className={styles.topBar} {...groupMotion(headerDelay, 6)}>
            <div className={styles.topLeftSlot}>
              {showStreak ? (
                <ImpactTag
                  label={`W${face.winStreak}`}
                  color={streakTagTone(face.winStreak).accent}
                />
              ) : null}
            </div>
            <div className={styles.topBadgeSlot}>
              <ImpactTag label={OUTCOME_LABEL[badge]} color={OUTCOME_TONE[badge]} />
            </div>
          </motion.div>

          <motion.div className={styles.matchRow} {...groupMotion(teamsDelay, 10)}>
            <div className={styles.matchSide}>
              <span className={`${styles.homeAwayLabel} ${nameOxanium.className}`}>
                HOME
              </span>
              <HalftoneJerseyMark
                accent={homeAccent}
                accentEnd={homeSecondary}
                className="h-[42px] w-[42px] shrink-0"
                glow="soft"
              />
              <span className={styles.skewWrap}>
                <span className={`${styles.teamNameSlant} ${nameBebas.className}`}>
                  {face.homeName}
                </span>
              </span>
            </div>

            <div className={styles.matchCenter}>
              <span className={styles.skewWrap}>
                <span className={`${styles.finalStatus} ${nameBebas.className}`}>
                  FINAL
                </span>
              </span>
              <span className={`${styles.finalScore} ${matchScoreClass}`}>
                {resultHome}
                <span className={styles.finalDash}> — </span>
                {resultAway}
              </span>
              <span className={styles.predCaption}>
                {ja ? "あなたの予想" : "YOUR CALL"}
              </span>
              <span className={`${styles.predScore} ${matchScoreClass}`}>
                {face.predHome}
                <span className={styles.predDash}> — </span>
                {face.predAway}
              </span>
            </div>

            <div className={styles.matchSide}>
              <span className={`${styles.homeAwayLabel} ${nameOxanium.className}`}>
                AWAY
              </span>
              <HalftoneJerseyMark
                accent={awayAccent}
                accentEnd={awaySecondary}
                className="h-[42px] w-[42px] shrink-0"
                glow="soft"
              />
              <span className={styles.skewWrap}>
                <span className={`${styles.teamNameSlant} ${nameBebas.className}`}>
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
                  — {ja ? "市場の偏り" : "MARKET BIAS"} —
                </span>
                <span
                  className={`${styles.biasPctHeaderNum} ${styles.biasPctHeaderNumAway} ${nameOxanium.className}`}
                  style={{ color: "#E8ECF0" }}
                >
                  {face.marketAwayPct.toFixed(1)}%
                </span>
              </div>
              <div className={styles.biasBarInner}>
                {Array.from({ length: BIAS_SEGS }).map((_, i) => {
                  const home = i < homeSegs;
                  const accent = home ? homeAccent : "#9CA3AF";
                  const op = home ? 0.95 : 0.55;
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
              {face.topScorer ? (
                <div className={styles.scorerBlock}>
                  <div className={styles.scorerValueRow}>
                    <span
                      className={`${styles.scorerLabel} ${nameOxanium.className}`}
                    >
                      TOP SCORER
                    </span>
                    <div className={styles.scorerNameWrap}>
                      <span className={styles.scorerNameSkew}>
                        <span
                          className={`${styles.scorerName} ${nameBebas.className}`}
                        >
                          {face.topScorer}
                        </span>
                      </span>
                    </div>
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
                    {ja ? "アップセット" : "UPSET"}
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
                    {ja ? "スコア" : "SCORE"}
                  </span>
                  <span className={styles.skewWrap}>
                    <span
                      className={`${styles.splitValue} ${styles.splitValueScore} ${matchScoreClass}`}
                    >
                      {face.totalPoints.toFixed(1)}
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
