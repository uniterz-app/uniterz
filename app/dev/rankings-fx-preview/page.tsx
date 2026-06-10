"use client";

/**
 * /dev/rankings-fx-preview
 * デザイン案 1〜5 のプレビュー専用ページ（本番コードには未接続）
 *
 * 1. MyRankCard のプレイヤーカード化 + 画像共有（案A）
 * 2. ホロカード傾き（CSS ポインタ追従）
 * 3. オーバーシュート着地 + 順位上昇フラッシュ（案C）
 * 4. 走査線スケルトン + バウンス除去（イージング比較）
 * 5. 1位の後光リング + 王冠ドロップ（案B）
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Share2, Flame, TrendingUp } from "lucide-react";
import { jp, nameBebas, nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import { FLAG_SRC } from "@/lib/rankings/country";

/* ============================================================
 * 共通: モックデータ
 * ============================================================ */
const MOCK = {
  handle: "RIKU_09",
  rank: 14,
  topPercent: 4.2,
  deltaPlaces: 3,
  streak: 5,
  countryCode: "JP",
  metrics: [
    { label: "WIN%", value: "68", pct: 68 },
    { label: "PTS", value: "1,284", pct: 82 },
    { label: "WC HITS", value: "12", pct: 55 },
  ],
} as const;

const CYAN = "#22d3ee";

/* ============================================================
 * 2. ホロカード傾き（CSS のみ・±8度）
 * ============================================================ */
function useHoloTilt(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glare, setGlare] = useState({ x: 50, y: 50, o: 0 });

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1
      const py = (e.clientY - r.top) / r.height;
      const rotY = (px - 0.5) * 16; // ±8deg
      const rotX = (0.5 - py) * 16;
      setStyle({
        transform: `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`,
        transition: "transform 60ms linear",
      });
      setGlare({ x: px * 100, y: py * 100, o: 0.55 });
    },
    [enabled]
  );

  const onLeave = useCallback(() => {
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
    });
    setGlare((g) => ({ ...g, o: 0 }));
  }, []);

  return { ref, style, glare, onMove, onLeave };
}

/* ============================================================
 * 1. プレイヤーカード（案A）＋ 2. ホロ傾き ＋ 共有ボタン
 * ============================================================ */
function PlayerCard({ tilt }: { tilt: boolean }) {
  const { ref, style, glare, onMove, onLeave } = useHoloTilt(tilt);
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "my-rank-card.png";
      a.click();
    } catch (e) {
      console.error("share failed", e);
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ touchAction: "none" }}
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-[400px] overflow-hidden rounded-none border"
        style={{
          ...style,
          borderColor: "rgba(34,211,238,0.28)",
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 38%, rgba(6,12,24,0.94) 100%)",
          boxShadow: [
            "0 16px 44px rgba(0,0,0,0.42)",
            "inset 0 1px 0 rgba(255,255,255,0.22)",
            "inset 0 0 0 1px rgba(34,211,238,0.14)",
            "0 0 26px rgba(34,211,238,0.10)",
          ].join(", "),
        }}
      >
        {/* 国旗バック（全幅・薄く） */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src={FLAG_SRC[MOCK.countryCode]}
            alt=""
            className="absolute right-[-6%] top-1/2 h-[120%] -translate-y-1/2 object-contain"
            style={{
              opacity: 0.1,
              maskImage:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.7) 55%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.7) 55%, black 100%)",
            }}
            draggable={false}
          />
        </div>

        {/* コーナーフレーム */}
        <div className="pointer-events-none absolute inset-0 z-20">
          {(["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"] as const).map((c) => (
            <div
              key={c}
              className={`absolute h-5 w-5 ${c}`}
              style={{ borderColor: "rgba(34,211,238,0.75)" }}
            />
          ))}
        </div>

        {/* ホロのグレア */}
        {tilt ? (
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: `radial-gradient(420px circle at ${glare.x}% ${glare.y}%, rgba(140,240,255,0.20) 0%, rgba(140,240,255,0.05) 32%, transparent 60%)`,
              opacity: glare.o,
              transition: "opacity 300ms ease",
            }}
          />
        ) : null}

        <div className="relative z-10 px-5 pb-4 pt-4">
          {/* 上段: ハンドル + 共有 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border text-[15px] font-black text-white/90"
                style={{
                  borderColor: "rgba(34,211,238,0.45)",
                  background:
                    "linear-gradient(160deg, rgba(34,211,238,0.18), rgba(255,255,255,0.04))",
                }}
              >
                R
              </div>
              <div>
                <div
                  className={`${jp.className} text-[15px] font-black leading-none text-white/95`}
                >
                  {MOCK.handle}
                </div>
                <div
                  className={`${nameOxanium.className} mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-300/70`}
                >
                  World Cup · Main Stage
                </div>
              </div>
            </div>
            <button
              onClick={handleShare}
              aria-label="カードを画像で共有"
              className="flex h-11 w-11 items-center justify-center rounded-none border text-cyan-300 transition-opacity active:opacity-60"
              style={{
                borderColor: "rgba(34,211,238,0.35)",
                background: "rgba(34,211,238,0.08)",
              }}
            >
              <Share2 className="h-[17px] w-[17px]" />
            </button>
          </div>

          {/* 中段: 巨大順位 + 相対表現 */}
          <div className="mt-3 flex items-end justify-between">
            <div className="flex items-end gap-1.5">
              <span
                className={`${nameBebas.className} leading-[0.85] text-[84px]`}
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, #EFFEFF 0%, #9BEAF6 36%, #22d3ee 68%, #0E7490 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 0 34px rgba(34,211,238,0.22)",
                }}
              >
                {MOCK.rank}
              </span>
              <span
                className={`${nameOxanium.className} mb-2 text-[13px] font-bold uppercase tracking-[0.14em] text-white/45`}
              >
                rank
              </span>
            </div>

            <div className="mb-1 flex flex-col items-end gap-1.5">
              <div
                className={`${nameOxanium.className} flex items-center gap-1 rounded-none border px-2 py-1 text-[12px] font-extrabold tracking-wide`}
                style={{
                  borderColor: "rgba(255,214,90,0.4)",
                  color: "#FFD65A",
                  background: "rgba(255,214,90,0.07)",
                }}
              >
                TOP {MOCK.topPercent}%
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`${nameOxanium.className} flex items-center gap-0.5 text-[12px] font-bold text-emerald-400`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />+{MOCK.deltaPlaces}
                </span>
                <span
                  className={`${nameOxanium.className} flex items-center gap-0.5 text-[12px] font-bold text-orange-400`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  {MOCK.streak}W
                </span>
              </div>
            </div>
          </div>

          {/* 下段: メトリクス3つのミニバー */}
          <div className="mt-3 grid grid-cols-3 gap-2.5 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {MOCK.metrics.map((mt) => (
              <div key={mt.label}>
                <div
                  className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.18em] text-white/40`}
                >
                  {mt.label}
                </div>
                <div
                  className={`${summaryMetricNumClass} mt-0.5 text-[16px] text-white/92`}
                >
                  {mt.value}
                </div>
                <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${mt.pct}%`,
                      background:
                        "linear-gradient(90deg, rgba(34,211,238,0.5), #22d3ee)",
                      boxShadow: "0 0 8px rgba(34,211,238,0.5)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 3. 数字の劇場（案C）: オーバーシュート着地 + 上昇フラッシュ
 * ============================================================ */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function useOvershootCount(target: number, durationMs: number, runKey: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.max(0, Math.round(target * easeOutBack(t))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, runKey]);
  return value;
}

function CountUpTheater() {
  const [runKey, setRunKey] = useState(0);
  const rank = useOvershootCount(MOCK.rank, 1100, runKey);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setFlash(false);
    const id = setTimeout(() => setFlash(true), 1100);
    return () => clearTimeout(id);
  }, [runKey]);

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative flex w-full max-w-[400px] items-center justify-between overflow-hidden rounded-none border px-5 py-4"
        animate={
          flash
            ? {
                boxShadow: [
                  "0 0 0px rgba(34,211,238,0)",
                  "0 0 44px rgba(34,211,238,0.55), inset 0 0 22px rgba(34,211,238,0.18)",
                  "0 0 0px rgba(34,211,238,0)",
                ],
              }
            : { boxShadow: "0 0 0px rgba(34,211,238,0)" }
        }
        transition={{ duration: 1.0, times: [0, 0.18, 1], ease: "easeOut" }}
        style={{
          borderColor: "rgba(34,211,238,0.25)",
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(6,12,24,0.92))",
        }}
      >
        <div>
          <div
            className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.22em] text-white/40`}
          >
            Your Rank
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span
              className={`${nameBebas.className} text-[56px] leading-[0.85] text-white`}
              style={{ textShadow: "0 0 26px rgba(34,211,238,0.3)" }}
            >
              {rank}
            </span>
            <AnimatePresence>
              {flash ? (
                <motion.span
                  initial={{ opacity: 0, y: 8, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  className={`${nameOxanium.className} mb-2 flex items-center gap-0.5 text-[14px] font-extrabold text-emerald-400`}
                >
                  <TrendingUp className="h-4 w-4" />+{MOCK.deltaPlaces}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
        <div
          className={`${jp.className} max-w-[150px] text-right text-[11px] leading-relaxed text-white/45`}
        >
          12→13→15→14 と揺れて着地。上昇時のみシアンに発火（下降は演出なし）
        </div>
      </motion.div>

      <button
        onClick={() => setRunKey((k) => k + 1)}
        className={`${jp.className} h-11 rounded-none border px-6 text-[13px] font-bold text-cyan-300 active:opacity-60`}
        style={{
          borderColor: "rgba(34,211,238,0.4)",
          background: "rgba(34,211,238,0.08)",
        }}
      >
        ▶ リプレイ
      </button>
    </div>
  );
}

/* ============================================================
 * 4. 走査線スケルトン + イージング比較
 * ============================================================ */
function SkeletonCompare() {
  return (
    <div className="grid w-full max-w-[400px] grid-cols-2 gap-3">
      <div>
        <div
          className={`${jp.className} mb-2 text-[11px] font-bold text-white/40`}
        >
          現状（animate-pulse）
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="mb-2 h-[52px] animate-pulse rounded-none bg-white/10"
          />
        ))}
      </div>
      <div>
        <div
          className={`${jp.className} mb-2 text-[11px] font-bold text-cyan-300/80`}
        >
          提案（走査線・HUD起動中）
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="fx-scanline-skeleton mb-2 h-[52px] rounded-none"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function EasingCompare() {
  const [go, setGo] = useState(false);
  return (
    <div className="flex w-full max-w-[400px] flex-col gap-3">
      {(
        [
          {
            label: "現状: バウンス cubic-bezier(0.34,1.45,0.64,1)",
            ease: "cubic-bezier(0.34, 1.45, 0.64, 1)",
            color: "rgba(255,255,255,0.55)",
          },
          {
            label: "提案: ease-out-quint cubic-bezier(0.22,1,0.36,1)",
            ease: "cubic-bezier(0.22, 1, 0.36, 1)",
            color: CYAN,
          },
        ] as const
      ).map((row) => (
        <div key={row.label}>
          <div
            className={`${jp.className} mb-1.5 text-[11px] font-bold text-white/40`}
          >
            {row.label}
          </div>
          <div className="relative h-9 overflow-hidden rounded-none border border-white/10 bg-white/[0.04]">
            <div
              className="absolute left-1 top-1 h-7 w-7 rounded-none"
              style={{
                background: row.color,
                transform: go ? "translateX(330px)" : "translateX(0px)",
                transition: `transform 600ms ${row.ease}`,
              }}
            />
          </div>
        </div>
      ))}
      <button
        onClick={() => setGo((g) => !g)}
        className={`${jp.className} mt-1 h-11 self-start rounded-none border px-6 text-[13px] font-bold text-cyan-300 active:opacity-60`}
        style={{
          borderColor: "rgba(34,211,238,0.4)",
          background: "rgba(34,211,238,0.08)",
        }}
      >
        ▶ 動かして比較
      </button>
    </div>
  );
}

/* ============================================================
 * 5. 1位の後光リング + 王冠ドロップ（案B）
 * ============================================================ */
function ThroneCard() {
  const [runKey, setRunKey] = useState(0);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[400px] pt-4">
        {/* 後光リング: conic-gradient がゆっくり回転（GPU負荷ほぼゼロ） */}
        <div
          className="fx-halo-spin pointer-events-none absolute inset-[-14px] top-[2px]"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, rgba(255,214,90,0.0) 8%, rgba(255,214,90,0.55) 16%, rgba(255,234,160,0.85) 20%, rgba(255,214,90,0.55) 24%, transparent 34%, transparent 100%)",
            filter: "blur(10px)",
            opacity: 0.8,
          }}
        />

        {/* 王冠ドロップ（週替わり1位交代時の初回演出） */}
        <motion.div
          key={runKey}
          className="pointer-events-none absolute left-[60px] top-[-6px] z-40"
          initial={{ opacity: 0, y: -34, rotate: -14, scale: 1.25 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 17,
            delay: 0.25,
          }}
        >
          <Crown
            className="h-[20px] w-[26px] text-[#F4C542]"
            fill="currentColor"
            strokeWidth={1.7}
          />
        </motion.div>

        {/* 1位カード本体（国旗を全幅に薄く敷く） */}
        <div
          className="relative overflow-hidden rounded-none border"
          style={{
            borderColor: "rgba(255,215,90,0.34)",
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.045) 42%, rgba(8,13,24,0.9) 100%)",
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,215,90,0.22), 0 0 22px rgba(255,215,90,0.12)",
          }}
        >
          {/* 国旗 全幅バック */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img
              src={FLAG_SRC["BR"]}
              alt=""
              className="h-full w-full object-cover"
              style={{
                opacity: 0.13,
                maskImage:
                  "linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.85) 100%)",
                WebkitMaskImage:
                  "linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.85) 100%)",
              }}
              draggable={false}
            />
          </div>

          <div className="relative z-10 flex min-h-[72px] items-center gap-3 px-4 py-2">
            <span
              className={`${summaryMetricNumClass} w-[28px] text-center text-[28px]`}
              style={{
                backgroundImage:
                  "linear-gradient(180deg,#fff8cf 0%,#f8d16e 22%,#fff4ba 46%,#ca8c24 78%,#fff8cf 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              1
            </span>
            <div
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full border text-[16px] font-black text-white/90"
              style={{
                borderColor: "rgba(255,215,90,0.5)",
                background:
                  "linear-gradient(160deg, rgba(255,215,90,0.16), rgba(255,255,255,0.04))",
              }}
            >
              C
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`${jp.className} truncate text-[17px] font-black text-white/95`}
              >
                CarlosFC_10
              </div>
              <div
                className={`${nameOxanium.className} mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-yellow-200/60`}
              >
                Defending Champion
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span
                className={`${summaryMetricNumClass} text-[26px]`}
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, #FFFDE8 0%, #FFE38A 22%, #FFBE3B 52%, #A65A00 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                32
              </span>
              <span className="mt-1 text-[10px] leading-none text-white/40">
                Posts 41
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setRunKey((k) => k + 1)}
        className={`${jp.className} h-11 rounded-none border px-6 text-[13px] font-bold text-yellow-300 active:opacity-60`}
        style={{
          borderColor: "rgba(255,215,90,0.4)",
          background: "rgba(255,215,90,0.07)",
        }}
      >
        ▶ 王冠ドロップをリプレイ
      </button>
    </div>
  );
}

/* ============================================================
 * ページ本体
 * ============================================================ */
function Section({
  no,
  title,
  desc,
  children,
}: {
  no: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/10 px-4 py-8">
      <div className="mx-auto max-w-[480px]">
        <div className="flex items-baseline gap-3">
          <span
            className={`${nameBebas.className} text-[30px] leading-none text-cyan-400/80`}
          >
            {no}
          </span>
          <h2 className={`${jp.className} text-[17px] font-black text-white/95`}>
            {title}
          </h2>
        </div>
        <p
          className={`${jp.className} mt-1.5 text-[12px] leading-relaxed text-white/50`}
        >
          {desc}
        </p>
        <div className="mt-5 flex justify-center">{children}</div>
      </div>
    </section>
  );
}

export default function RankingsFxPreviewPage() {
  const [tilt, setTilt] = useState(true);

  return (
    <main
      className="min-h-screen pb-24 text-white"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #0c1626 0%, #070b14 55%, #05080f 100%)",
      }}
    >
      <style>{`
        .fx-scanline-skeleton {
          background-color: rgba(255,255,255,0.06);
          background-image: linear-gradient(
            100deg,
            transparent 30%,
            rgba(34,211,238,0.14) 46%,
            rgba(140,240,255,0.22) 50%,
            rgba(34,211,238,0.14) 54%,
            transparent 70%
          );
          background-size: 220% 100%;
          background-position: 130% 0;
          animation: fxScan 1.4s ease-in-out infinite;
        }
        @keyframes fxScan {
          0% { background-position: 130% 0; }
          100% { background-position: -90% 0; }
        }
        .fx-halo-spin {
          animation: fxHalo 7s linear infinite;
        }
        @keyframes fxHalo {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fx-scanline-skeleton { animation: none; }
          .fx-halo-spin { animation: none; opacity: 0.4; }
        }
      `}</style>

      <header className="px-4 pb-2 pt-10 text-center">
        <div
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400/70`}
        >
          Dev Preview · Not in Production
        </div>
        <h1 className={`${jp.className} mt-2 text-[22px] font-black`}>
          ランキング演出 5案プレビュー
        </h1>
        <p className={`${jp.className} mt-1 text-[12px] text-white/45`}>
          実装前の見た目確認用。各セクションは独立して動きます。
        </p>
      </header>

      <Section
        no="1"
        title="プレイヤーカード化 MyRankCard（案A）"
        desc="巨大順位 + TOP◯% + 連勝 + ミニメトリクス。右上の共有ボタンで html-to-image によりカードを PNG 保存（実機ではシェアシート起動）。"
      >
        <PlayerCard tilt={false} />
      </Section>

      <Section
        no="2"
        title="ホロカード傾き（CSS のみ）"
        desc="ポインタ/指の位置で ±8度傾き + グレア追従。3D エンジン不要、transform のみで GPU 負荷は最小。カードの上で指やマウスを動かしてください。"
      >
        <div className="w-full max-w-[400px]">
          <PlayerCard tilt={tilt} />
          <label
            className={`${jp.className} mt-3 flex items-center gap-2 text-[12px] text-white/55`}
          >
            <input
              type="checkbox"
              checked={tilt}
              onChange={(e) => setTilt(e.target.checked)}
              className="h-4 w-4 accent-cyan-400"
            />
            傾きを有効化
          </label>
        </div>
      </Section>

      <Section
        no="3"
        title="数字の劇場（案C）"
        desc="オーバーシュートして着地するカウントアップ + 順位上昇時のみシアン発火。下降時は何も演出しない。"
      >
        <CountUpTheater />
      </Section>

      <Section
        no="4"
        title="走査線スケルトン + バウンス除去"
        desc="左: 現在の animate-pulse。右: HUD 起動中の走査線。下: NavBar のバウンスイージングを ease-out-quint に変えた場合の比較。"
      >
        <div className="flex w-full max-w-[400px] flex-col gap-7">
          <SkeletonCompare />
          <EasingCompare />
        </div>
      </Section>

      <Section
        no="5"
        title="王座演出 — 1位の後光リング（案B）"
        desc="conic-gradient の後光がゆっくり回転 + 国旗を全幅に薄く敷く + 1位交代時のみ王冠が落ちてくる 600ms 演出。"
      >
        <ThroneCard />
      </Section>
    </main>
  );
}
