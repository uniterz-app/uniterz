"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

type StylePoint = {
  homeAwayBias: number;
  marketBias: number;
  winRate: number; // 0–1
  key?: string;
};

type Props = {
  points: StylePoint[];
};

const clamp = (v: number, min = -1, max = 1) =>
  Math.min(max, Math.max(min, v));

/* =========================
 * 勝率 → サイズ（40–85% / 6分割）
 * ========================= */
function winRateToSize(winRate: number) {
  const pct = Math.round(winRate * 100);
  if (pct < 40) return 8;
  if (pct < 47) return 10;
  if (pct < 54) return 13;
  if (pct < 61) return 16;
  if (pct < 68) return 19;
  if (pct < 75) return 22;
  return 26;
}

/* =========================
 * コメント生成
 * ========================= */
function buildStyleComment(p: StylePoint) {
  const x = p.homeAwayBias;
  const y = -p.marketBias;
  const winPct = Math.round(p.winRate * 100);
  const DEAD = 0.12;

  let axisLabel = "バランス";
  let typeLabel = "バランス型";
  let tendency = "条件に強い偏りはありません。";

  if (x > DEAD && y > DEAD) {
    axisLabel = "Home × 順当";
    typeLabel = "セオリー重視タイプ";
    tendency =
      "ホーム有利や市場評価を素直に信頼し、王道条件を重視する傾向があります。";
  } else if (x > DEAD && y < -DEAD) {
    axisLabel = "Home × 逆張り";
    typeLabel = "文脈判断タイプ";
    tendency =
      "ホーム条件でも状況次第で市場と逆の判断を行う柔軟さがあります。";
  } else if (x < -DEAD && y > DEAD) {
    axisLabel = "Away × 順当";
    typeLabel = "条件反転タイプ";
    tendency =
      "アウェイ条件を織り込んだ上で、順当な期待値を丁寧に評価しています。";
  } else if (x < -DEAD && y < -DEAD) {
    axisLabel = "Away × 逆張り";
    typeLabel = "高リスク選好タイプ";
    tendency =
      "不利条件や市場逆張りを積極的に取りにいく攻撃的な判断傾向があります。";
  }

  let performance = "勝率は平均的なレンジに収まっています。";
  if (winPct >= 66) {
    performance = "勝率が高く、現在の分析スタイルは明確に機能しています。";
  } else if (winPct < 50) {
    performance = "勝率が低めで、判断軸の調整余地があります。";
  }

  return {
    title: `あなたは ${axisLabel} の ${typeLabel} です`,
    body: `${tendency} 現在の勝率は ${winPct}%。${performance}`,
  };
}

export default function AnalysisStyleMap({ points }: Props) {
  const iv = useInViewOnce({ threshold: 0.2, rootMargin: "0px 0px -4% 0px" });
  const isInView = iv.inView;

  if (!points || points.length === 0) return null;

  const lastIndex = points.length - 1;
  const latest = points[lastIndex];
  const comment = useMemo(() => buildStyleComment(latest), [latest]);

  return (
    <motion.div
      ref={iv.ref}
      initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 12, filter: "blur(8px)" }
      }
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#050814]/85 p-4 space-y-3 shadow-[0_14px_40px_rgba(0,0,0,0.55),0_0_24px_rgba(34,211,238,0.08)]"
    >
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1 space-y-3">
      {/* タイトル */}
      <div className="text-sm font-semibold text-white lg:text-base">あなたの分析スタイル</div>

      {/* マップ */}
      <div className="relative h-48 rounded-xl overflow-hidden bg-[#050814]/40 lg:h-56">
        {/* 方眼 */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.45 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
        />

        {/* 軸 */}
        <motion.div
          className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30"
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-0 right-0 h-px bg-white/30"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
        />

        {/* ラベル */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-white/40">
          Away
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-white/40">
          Home
        </div>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] text-white/40">
          順当
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-white/40">
          逆張り
        </div>

        {/* 点 */}
        {points.map((p, i) => {
          const x = clamp(p.homeAwayBias);
          const y = clamp(-p.marketBias);
          const size = winRateToSize(p.winRate);
          const isLatest = i === lastIndex;

          return (
            <motion.div
              key={p.key ?? i}
              className={`absolute rounded-full bg-orange-400 ${
                isLatest ? "shadow-[0_0_18px_rgba(251,146,60,0.75)]" : ""
              }`}
              style={{
                width: size,
                height: size,
                left: `${50 + x * 40}%`,
                top: `${50 - y * 40}%`,
                transform: "translate(-50%, -50%)",
                opacity: isLatest ? 1 : 0.35,
              }}
              initial={{ scale: 0 }}
              animate={
                isInView
                  ? isLatest
                    ? { scale: [1, 1.2, 1] }
                    : { scale: 1 }
                  : {}
              }
              transition={
                isLatest
                  ? {
                      delay: 0.9,
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : {
                      duration: 0.35,
                      ease: "easeOut",
                      delay: 0.6 + i * 0.12,
                    }
              }
            />
          );
        })}
      </div>

      {/* コメント */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="rounded-xl bg-white/5 border border-white/10 p-2 md:p-3"
      >
        <p className="text-xs md:text-[15px] font-semibold text-white/90">
          {comment.title}
        </p>
        <p className="mt-0.5 text-xs md:text-[15px] leading-relaxed text-white/75">
          {comment.body}
        </p>
      </motion.div>

      <p className="text-[11px] text-white/50">
        横軸：Away ←→ Home / 縦軸：順当 ←→ 逆張り
        <br />
        点の大きさ：勝率（40–85%・6段階）
      </p>
      </div>
    </motion.div>
  );
}