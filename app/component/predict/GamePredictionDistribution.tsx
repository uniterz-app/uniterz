// app/component/predict/GamePredictionDistribution.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DonutChart, { DonutSegment } from "./DonutChart";
import { shortTeamName } from "@/lib/team-alias";

type Props = {
  gameId: string;
  homeName: string;
  awayName: string;
  homeColor?: string;
  awayColor?: string;
  maxLegend?: number;
};

type LegKind = "main" | "secondary" | "tertiary";
type Post = { legs?: Array<{ label?: string; pct?: number; kind?: LegKind }> };

const NEUTRAL = "rgba(255,255,255,0.55)";
const WEIGHT: Record<string, number> = { main: 3, secondary: 2, tertiary: 1 };

// 小差→大差
const BUCKETS = [
  { min: 1, max: 3 },
  { min: 4, max: 6 },
  { min: 7, max: 9 },
  { min: 10, max: 14 },
  { min: 15, max: 19 },
  { min: 20, max: 24 },
  { min: 25, max: 999 },
] as const;

/* ================= 色ユーティリティ ================= */
function hexToHsl(hex: string) {
  const s = hex.replace("#", "");
  const n = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s, 16);
  const r = ((n >> 16) & 255) / 255,
    g = ((n >> 8) & 255) / 255,
    b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, sat = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: sat * 100, l: l * 100 };
}
function hslToHex(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  const f = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = f(p, q, h + 1 / 3);
    g = f(p, q, h);
    b = f(p, q, h - 1 / 3);
  }
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
const LIGHTNESS_STOPS = [74, 68, 60, 54, 48, 44, 40];
function shadeForBucket(baseHex: string, bucketIndex: number) {
  const { h, s } = hexToHsl(baseHex);
  const lTarget = LIGHTNESS_STOPS[Math.max(0, Math.min(LIGHTNESS_STOPS.length - 1, bucketIndex))];
  const sBoost = Math.min(100, s + 6);
  return hslToHex(h, sBoost, lTarget);
}

/* ============== ラベル解析（勝敗＋点差バケツ） ============== */
function parseLabel(label: string, homeName: string, awayName: string) {
  const lower = label.toLowerCase();
  const home = String(shortTeamName(homeName)).toLowerCase();
const away = String(shortTeamName(awayName)).toLowerCase();
  let side: "home" | "away" | "neutral" = "neutral";
  if (home && lower.includes(home)) side = "home";
  if (away && lower.includes(away)) side = side === "home" ? "neutral" : "away";

  const mRange = lower.match(/(\d+)\s*[–\-~〜]\s*(\d+)\s*点差/);
  const mGte = lower.match(/(\d+)\s*点差以上/);
  const mSingle = lower.match(/(\d+)\s*点差/);

  let idx = 0;
  if (mRange) {
    const a = parseInt(mRange[1]!, 10), b = parseInt(mRange[2]!, 10);
    const mid = Math.round((a + b) / 2);
    idx = BUCKETS.findIndex((bk) => mid >= bk.min && mid <= bk.max);
  } else if (mGte) {
    const n = parseInt(mGte[1]!, 10);
    idx = BUCKETS.findIndex((bk) => n >= bk.min && bk.max >= n);
    if (idx < 0) idx = BUCKETS.length - 1;
  } else if (mSingle) {
    const n = parseInt(mSingle[1]!, 10);
    idx = BUCKETS.findIndex((bk) => n >= bk.min && n <= bk.max);
    if (idx < 0) idx = n >= 25 ? BUCKETS.length - 1 : 0;
  }
  if (idx < 0) idx = 0;
  return { side, bucketIndex: idx };
}

/* ============== 凡例の表示用テキスト生成（モバイル2行） ============== */
function formatLegendTwoLines(
  rawLabel: string,
  homeName: string,
  awayName: string
): { line1: string; line2: string } {
  const { side } = parseLabel(rawLabel, homeName, awayName);
  const team = side === "home" ? shortTeamName(homeName) : side === "away" ? shortTeamName(awayName) : "その他";

  // レンジ文字だけを抽出・整形（なければ元ラベルを使用）
  const lower = rawLabel.toLowerCase();
  const mRange = lower.match(/(\d+)\s*[–\-~〜]\s*(\d+)\s*点差/);
  const mGte = lower.match(/(\d+)\s*点差以上/);
  const mSingle = lower.match(/(\d+)\s*点差/);

  let rangeText = "";
  if (mRange) rangeText = `${mRange[1]}–${mRange[2]}点差で勝利`;
  else if (mGte) rangeText = `${mGte[1]}点差以上で勝利`;
  else if (mSingle) rangeText = `${mSingle[1]}点差で勝利`;
  else rangeText = rawLabel;

  return { line1: String(team), line2: rangeText };
}

/* ============================ 本体 ============================ */
export default function GamePredictionDistribution({
  gameId,
  homeName,
  awayName,
  homeColor = "#0ea5e9",
  awayColor = "#f43f5e",
  maxLegend = 6,
}: Props) {
  const [agg, setAgg] = useState<{ label: string; sumWeight: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "posts"), where("gameId", "==", gameId), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const map = new Map<string, number>();
      snap.docs.forEach((d) => {
        const data = d.data() as Post;
        (data.legs ?? []).forEach((leg) => {
          const label = String(leg?.label ?? "").trim();
          if (!label) return;
          const pct = Number(leg?.pct ?? 0);
          if (!isFinite(pct) || pct <= 0) return;
          const w = WEIGHT[String(leg?.kind ?? "")] ?? 1;
          map.set(label, (map.get(label) ?? 0) + w);
        });
      });
      const arr = [...map.entries()]
        .map(([label, sumWeight]) => ({ label, sumWeight }))
        .sort((a, b) => b.sumWeight - a.sumWeight);
      setAgg(arr);
      setLoading(false);
    });
    return () => unsub();
  }, [gameId]);

  const total = useMemo(() => agg.reduce((s, x) => s + x.sumWeight, 0), [agg]);

  const { segs, legend } = useMemo(() => {
    if (total <= 0) return { segs: [] as DonutSegment[], legend: [] as typeof agg };
    const top = agg.slice(0, maxLegend);
    const rest = agg.slice(maxLegend).reduce((s, x) => s + x.sumWeight, 0);
    const legendArr = rest > 0 ? [...top, { label: "その他", sumWeight: rest }] : top;

    const colorFor = (label: string) => {
      const { side, bucketIndex } = parseLabel(label, homeName, awayName);
      if (side === "home") return shadeForBucket(homeColor, bucketIndex);
      if (side === "away") return shadeForBucket(awayColor, bucketIndex);
      return NEUTRAL;
    };
    const segs: DonutSegment[] = legendArr.map((x) => ({
      label: x.label,
      value: Math.max(0, x.sumWeight / total),
      color: colorFor(x.label),
    }));
    return { segs, legend: legendArr };
  }, [agg, total, homeName, awayName, homeColor, awayColor, maxLegend]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 text-white p-3 md:p-4">
      <div className="mb-2 md:mb-3 font-bold text-lg md:text-xl">みんなの分析分布</div>

      {loading && <div className="text-sm opacity-70">集計中…</div>}

      {!loading && total <= 0 && (
        <div className="text-sm opacity-70">まだこの試合の分析がありません。最初の分析を投稿しましょう。</div>
      )}

      {!loading && total > 0 && (
        <>
          {/* ===== モバイル：縦並び（ドーナツ中央&少し小さく、凡例2行） ===== */}
          <div className="md:hidden grid gap-3">
            <div className="grid place-items-center">
              <DonutChart segments={segs} size={148} thickness={44} />
            </div>
            <LegendList
              segs={segs}
              legend={legend}
              total={total}
              mobileTwoLine
              homeName={homeName}
              awayName={awayName}
            />
          </div>

          {/* ===== Web：左ドーナツ / 右凡例（既存レイアウトは崩さない） ===== */}
          <div className="hidden md:flex md:flex-row md:items-start md:gap-60">
            {/* 左：ドーナツ（左に余白を空けつつ中央寄せ見え） */}
            <div className="shrink-0 md:pl-40 w-[260px] grid place-items-center">
              {/* 穴の太さは据え置き、sizeのみ現行値のまま */}
              <DonutChart segments={segs} size={240} thickness={72} />
            </div>

            {/* 右：凡例（幅を詰める・%との間隔を狭める） */}
            <div className="min-w-0 flex-1">
              <LegendList segs={segs} legend={legend} total={total} tight />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ================= 凡例 ================= */
function LegendList({
  segs,
  legend,
  total,
  tight = false,
  mobileTwoLine = false,
  homeName,
  awayName,
}: {
  segs: DonutSegment[];
  legend: { label: string; sumWeight: number }[];
  total: number;
  tight?: boolean; // Webで幅を詰める
  mobileTwoLine?: boolean; // モバイルで2行表示
  homeName?: string;
  awayName?: string;
}) {
  const wrapperCls = ["w-full", tight ? "md:max-w-[520px]" : "md:max-w-[620px]", "grid gap-2"].join(" ");

  return (
    <div className={wrapperCls}>
      {legend.map((x, i) => {
        const percent = total > 0 ? (x.sumWeight / total) * 100 : 0;
        const color = i < segs.length ? segs[i].color : NEUTRAL;

        if (mobileTwoLine) {
          const { line1, line2 } = formatLegendTwoLines(x.label, homeName ?? "", awayName ?? "");
          return (
            <div key={`${x.label}-${i}`} className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className="mt-1 h-3 w-3 rounded-sm flex-none" style={{ backgroundColor: color }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight truncate">{line1}</div>
                  <div className="text-[12px] opacity-85 leading-tight truncate">{line2}</div>
                </div>
              </div>
              {/* モバイルは%を少し小さく＆固定幅を狭くして詰める */}
              <div className="w-12 text-right text-sm tabular-nums font-semibold">{percent.toFixed(1)}%</div>
            </div>
          );
        }

        // Web（1行）：ラベルと%の間隔をやや詰め、%は固定幅右寄せ
        return (
          <div key={`${x.label}-${i}`} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
              <div className="text-sm md:text-base truncate">{x.label}</div>
            </div>
            <div className="w-14 md:w-16 text-right text-sm md:text-base tabular-nums font-semibold">
              {percent.toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

