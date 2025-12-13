// app/mobile/(with-nav)/rankings/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type React from "react";
import type {
  Period,
  LeagueTab,
  Metric,
  RankingRow,
  RankingResponse,
} from "@/lib/rankings/types";

/* ====== UI 定数 ====== */
const MAX_AVATAR = 70;
const AVATAR_BOX_H = MAX_AVATAR + 26;
const CARD_H = 190;

const BADGE_GLOBAL_NUDGE = { x: 0, y: 0 };

function badgeOffsetByRank(rank: number) {
  const map: Record<number, { x: number; y: number }> = {
    1: { x: 0, y: 5 },
    2: { x: -2, y: 2 },
    3: { x: 1, y: -5 },
  };
  return map[rank] ?? { x: 0, y: 0 };
}

function BlobBG({ rank }: { rank: number }) {
  const palette: Record<number, [string, string]> = {
    1: ["#fef3c7", "#facc15"],
    2: ["#e0f2fe", "#60a5fa"],
    3: ["#fed7aa", "#fb923c"],
  };
  const [c1, c2] = palette[rank] ?? ["#6ee7b7", "#14b8a6"];

  return (
    <div
      className="pointer-events-none absolute inset-x-3 inset-y-4 opacity-70 blur-2xl"
      style={{
        borderRadius: "1.5rem",
        backgroundImage: `
          radial-gradient(45% 45% at 25% 25%, ${c1} 0%, transparent 60%),
          radial-gradient(55% 55% at 75% 75%, ${c2} 0%, transparent 70%)`,
        filter: "blur(22px)",
      }}
    />
  );
}

/* ============ ページ本体 ============ */

export default function MobileRankingsPage() {
  const [league, setLeague] = useState<LeagueTab>("nba");
  const [period, setPeriod] = useState<Period>("week");

  const [rows, setRows] = useState<Record<Metric, RankingRow[]>>({
  winRate: [],
  avgPrecision: [],
  accuracy: [],
  consistency: [],   // ← 一致度（Metric にある前提）
  avgUpset: [],
});

  const [loading, setLoading] = useState<Record<Metric, boolean>>({
  winRate: false,
  avgPrecision: false,
  accuracy: false,
  consistency: false,
  avgUpset: false,
});

  const [error, setError] = useState<string | null>(null);

  const heroCount = 3;
 const listCount = period === "week" ? 10 : 20;

  const headingStyle: React.CSSProperties = {
    fontFamily:
      "'Hiragino Kaku Gothic Std','Hiragino Kaku Gothic ProN','Hiragino Sans',system-ui,sans-serif",
    fontWeight: 800,
    letterSpacing: "0.02em",
  };

  /* ====== fetch (V2) ====== */
  async function fetchMetric(metric: Metric) {
    try {
      setLoading((prev) => ({ ...prev, [metric]: true }));
      const query = `/api/rankings-v2?period=${period}&league=${league}&metric=${metric}&limit=50`;

      const res = await fetch(query);
      const json: RankingResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(json.error || "load failed");

      setRows((prev) => ({ ...prev, [metric]: json.rows ?? [] }));
    } catch (e: any) {
      setError(e?.message ?? "failed to load");
    } finally {
      setLoading((prev) => ({ ...prev, [metric]: false }));
    }
  }

  useEffect(() => {
  setError(null);

  fetchMetric("winRate");
  fetchMetric("avgPrecision");
  fetchMetric("accuracy");
  fetchMetric("consistency");
  fetchMetric("avgUpset");
}, [league, period]);

  const noData = Object.values(rows).every((arr) => arr.length === 0);

  return (
    <>
      {/* ヘッダー */}
      <header className="pt-2 sticky top-0 z-40 border-b border-white/10 bg-[var(--color-app-bg,#0b2126)]/85 backdrop-blur-md">
        <div className="relative h-11 flex items-center justify-center px-3">
          <img src="/logo/logo.png" alt="Uniterz Logo" className="w-10 h-auto" />
        </div>
      </header>

      <div className="mx-auto w-full px-3 py-6 space-y-6">
        <TabsRow league={league} setLeague={setLeague} period={period} setPeriod={setPeriod} />

        {error && <p className="text-xs text-center text-red-300">{error}</p>}

        {noData ? (
          <p className="text-sm text-center text-white/60">ランキングデータがありません。</p>
        ) : (
          <>
          <MobileSection title="勝率" metric="winRate" rows={rows.winRate} league={league} period={period} />
<MobileSection title="スコア精度" metric="avgPrecision" rows={rows.avgPrecision} league={league} period={period} />
<MobileSection title="予測精度" metric="accuracy" rows={rows.accuracy} league={league} period={period} />
<MobileSection title="一致度" metric="consistency" rows={rows.consistency} league={league} period={period} />
<MobileSection title="Upsetスコア" metric="avgUpset" rows={rows.avgUpset} league={league} period={period} />
                 
          </>
        )}
      </div>
    </>
  );
}

/* ============ UI Section ============ */

function MobileSection({
  title,
  metric,
  rows,
  league,
  period,
}: {
  title: string;
  metric: Metric;
  rows: RankingRow[];
  league: LeagueTab;
  period: Period;
}) {
  const heroCount = 3;
const listCount = period === "week" ? 10 : 20;

  const headingStyle: React.CSSProperties = {
    fontFamily:
      "'Hiragino Kaku Gothic Std','Hiragino Kaku Gothic ProN','Hiragino Sans',system-ui,sans-serif",
    fontWeight: 800,
  };

  return (
    <section className="space-y-4">
      <h2 className="text-white text-[20px] text-center" style={headingStyle}>
        {title}
      </h2>

      <HeroRow rows={rows} heroCount={heroCount} metric={metric} league={league} period={period} />

      <RankingList
        rows={rows.slice(heroCount, listCount)}
        metric={metric}
        baseRank={heroCount}
      />
    </section>
  );
}

/* ============ Tabs ============ */

function TabsRow(props: {
  league: LeagueTab;
  setLeague: (v: LeagueTab) => void;
  period: Period;
  setPeriod: (v: Period) => void;
}) {
  const { league, setLeague, period, setPeriod } = props;

  const Tab = ({
    label,
    active,
    onClick,
  }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-2xl border transition-colors text-sm",
        active
          ? "bg-white/12 border-white/30 text-white font-semibold ring-1 ring-white/15"
          : "bg-white/5 border-white/10 text-white/70 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Tab label="NBA" active={league === "nba"} onClick={() => setLeague("nba")} />
        <Tab label="B1" active={league === "b1"} onClick={() => setLeague("b1")} />
      </div>

      <div className="flex gap-2">
        <Tab label="週間" active={period === "week"} onClick={() => setPeriod("week")} />
        <Tab label="月間" active={period === "month"} onClick={() => setPeriod("month")} />
      </div>
    </div>
  );
}


/* =========================
 * Hero (Top3固定) — V2対応版
 * =======================*/
function HeroRow({
  rows,
  heroCount,
  metric,
  league,
  period, // ★ 追加: 週間/月間で表示が変わる可能性あり
}: {
  rows: RankingRow[];
  heroCount: number;
  metric: Metric;
  league: LeagueTab;
  period: Period;
}) {
  const base = rows.slice(0, heroCount);
  const ORDER_3 = [1, 0, 2];
  const top = ORDER_3.map((i) => base[i]).filter(Boolean);

  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      {top.map((r, i) => {
        const rank = (base.indexOf(r) ?? i) + 1;

        const ring = ringByRank(rank);
        const avatarSize = avatarSizeByRankMobile(rank);
        const { badgeWidth, badgeLift } = badgeDimsByRankMobile(rank, avatarSize);

        /* --------------------------
         * ★ metricごとの値の表示切替 (V2仕様)
         * ------------------------ */
        let value = "-";

        if (metric === "winRate") {
          value = `${Math.round((r.winRate ?? 0) * 100)}%`;
        } else if (metric === "accuracy") {
          value = `${Math.round(r.accuracy ?? 0)}%`;
        } else if (metric === "avgPrecision") {
          value = `${(r.avgPrecision ?? 0).toFixed(1)} pt`;
        } else if (metric === "avgUpset") {
          value = `${(r.avgUpset ?? 0).toFixed(1)}`;
        }
        else if (metric === "consistency") {
  value = `${Math.round((r.consistency ?? 0) * 100)}%`;
}


        /* --------------------------
         * ★ metricごとに色変更
         * ------------------------ */
        const chip =
  metric === "winRate"
    ? "bg-emerald-600 text-white"
    : metric === "accuracy"
    ? "bg-blue-600 text-white"
    : metric === "avgPrecision"
    ? "bg-purple-600 text-white"
    : metric === "consistency"
    ? "bg-cyan-600 text-white"
    : metric === "avgUpset"
    ? "bg-orange-600 text-white"
    : "bg-gray-500 text-white";

        // バッジ位置調整
        const nudge = badgeOffsetByRank(rank);
        const topPx = -badgeLift + (BADGE_GLOBAL_NUDGE.y + nudge.y);
        const leftPx = BADGE_GLOBAL_NUDGE.x + nudge.x;

        return (
          <a
            key={r.uid}
            href={`/mobile/u/${encodeURIComponent(r.uid)}`}
            className={[
              "relative rounded-2xl border border-white/10 bg-white/[.04]",
              "px-2.5 pt-8 pb-3 flex flex-col items-center gap-0 overflow-visible",
              "shadow-[0_10px_28px_rgba(0,0,0,.22)]",
            ].join(" ")}
            style={{ height: CARD_H }}
          >
            <BlobBG rank={rank} />

            <div
              className="absolute left-1/2 -translate-x-1/2 z-20"
              style={{ top: topPx, width: badgeWidth, marginLeft: leftPx }}
            >
              <RankBadge
                rank={rank}
                size={badgeWidth}
                priority={rank <= 2}
                league={league}
              />
            </div>

            <div
              className="w-full flex items-center justify-center"
              style={{ height: AVATAR_BOX_H }}
            >
              <div className="relative">
                <div
                  className={[
                    "rounded-full overflow-hidden ring-2 shadow-[0_8px_22px_rgba(0,0,0,.30)]",
                    ring.ring,
                  ].join(" ")}
                  style={{ width: avatarSize, height: avatarSize }}
                >
                  <Avatar
                    name={r.displayName}
                    photoURL={r.photoURL}
                    size={avatarSize}
                  />
                </div>
                <div
                  className={[
                    "absolute inset-0 rounded-full blur-xl pointer-events-none",
                    ring.glow,
                  ].join(" ")}
                />
              </div>
            </div>

            <div className="text-white font-semibold text-[13px] text-center max-w-[16ch] truncate h-[18px] flex items-center">
              {r.displayName}
            </div>

            <div className="h-[28px] mt-2 flex items-center">
              <span
                className={[
                  "px-3 py-1 rounded-2xl text-[12px] font-black tracking-tight",
                  chip,
                ].join(" ")}
              >
                {value}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

/* =========================
 * RankBadge (UIは現状維持)
 * =======================*/
function RankBadge({
  rank,
  size,
  priority = false,
  league,
}: {
  rank: number;
  size: number;
  priority?: boolean;
  league: LeagueTab;
}) {
  if (rank < 1 || rank > 5) return null;

  let src: string;

  // B1/NBA で 1〜3 位だけ専用
  if (league === "b1" && rank <= 3) {
    src = `/rankings/emblems/b1rank-${rank}.png`;
  } else if (league === "nba" && rank <= 3) {
    src = `/rankings/emblems/nbarank-${rank}.png`;
  } else {
    src = `/rankings/emblems/rank-${rank}.png`;
  }

  return (
    <Image
      src={src}
      alt={`Rank ${rank}`}
      width={size}
      height={Math.round(size * 0.7)}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      style={{ width: size, height: "auto", display: "block" }}
    />
  );
}

/* =========================
 * 見た目は変更なし
 * =======================*/
function ringByRank(rank: number) {
  if (rank === 1) return { ring: "ring-yellow-300", glow: "bg-yellow-300/25" };
  if (rank === 2) return { ring: "ring-slate-200", glow: "bg-slate-200/20" };
  if (rank === 3) return { ring: "ring-amber-600", glow: "bg-amber-600/25" };
  if (rank === 4) return { ring: "ring-cyan-300", glow: "bg-cyan-300/25" };
  return { ring: "ring-teal-300", glow: "bg-teal-300/25" };
}

function avatarSizeByRankMobile(rank: number) {
  if (rank === 1) return MAX_AVATAR;
  if (rank === 2) return 65;
  return 60;
}

function badgeDimsByRankMobile(
  rank: number,
  avatarSize: number
): { badgeWidth: number; badgeLift: number } {
  const widthScale: Record<number, number> = {
    1: 1.8,
    2: 1.7,
    3: 1.9,
    4: 1.05,
    5: 0.98,
  };
  const liftScale: Record<number, number> = {
    1: 0.4,
    2: 0.34,
    3: 0.26,
    4: 0.22,
    5: 0.18,
  };

  const badgeWidth = Math.round(avatarSize * (widthScale[rank] ?? 1.0));
  const EXTRA_DOWN = 8;
  const badgeLift = Math.max(
    0,
    Math.round(badgeWidth * (liftScale[rank] ?? 0.3)) - EXTRA_DOWN
  );
  return { badgeWidth, badgeLift };
}

/* =========================
 * ★ Listing(Row) の V2対応版
 * =======================*/
function RankingList({
  rows,
  metric,
  baseRank,
}: {
  rows: RankingRow[];
  metric: Metric;
  baseRank: number;
}) {
  return (
    <div className="w-full rounded-2xl border border-white/12 bg-white/[.04] overflow-hidden divide-y divide-white/10">
      {rows.map((r, i) => {
        const rank = baseRank + i + 1;

        /* ----------------------------
         * ★ V2仕様の表示値
         * ----------------------------*/
        let value = "-";

        if (metric === "winRate") {
          value = `${Math.round((r.winRate ?? 0) * 100)}%`;
        } else if (metric === "accuracy") {
          value = `${Math.round(r.accuracy ?? 0)}%`;
        } else if (metric === "avgPrecision") {
          value = `${(r.avgPrecision ?? 0).toFixed(1)} pt`;
        } else if (metric === "avgUpset") {
          value = `${(r.avgUpset ?? 0).toFixed(1)}`;
        }
        else if (metric === "consistency") {
  value = `${Math.round((r.consistency ?? 0) * 100)}%`;
}

        /* ----------------------------
         * ★ metricごとに色を変える
         * ----------------------------*/
        const chip =
  metric === "winRate"
    ? "bg-emerald-600 text-white"
    : metric === "accuracy"
    ? "bg-blue-600 text-white"
    : metric === "avgPrecision"
    ? "bg-purple-600 text-white"
    : metric === "consistency"
    ? "bg-cyan-600 text-white"
    : metric === "avgUpset"
    ? "bg-orange-600 text-white"
    : "bg-gray-500 text-white";

        return (
          <a
            key={r.uid}
            href={`/mobile/u/${encodeURIComponent(r.uid)}`}
            className="flex items-center px-4 py-4 hover:bg-white/[.06]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <RankCircle rank={rank} />
              <Avatar name={r.displayName} photoURL={r.photoURL} size={44} />
              <div className="text-white text-[15px] font-semibold min-w-0 truncate">
                {r.displayName}
              </div>
            </div>

            <span
              className={[
                "ml-auto px-3 py-1.5 rounded-2xl text-sm font-black tracking-tight",
                chip,
              ].join(" ")}
            >
              {value}
            </span>
          </a>
        );
      })}
    </div>
  );
}

/* =========================
 * RankCircle — UIそのまま
 * =======================*/
function RankCircle({ rank }: { rank: number }) {
  return (
    <div className="w-8 h-8 rounded-full grid place-items-center text-[12px] font-extrabold border border-amber-300/60 text-amber-300/95">
      {rank}
    </div>
  );
}

/* =========================
 * Avatar — UIそのまま
 * =======================*/
function Avatar({
  name,
  photoURL,
  size = 40,
}: {
  name: string;
  photoURL?: string;
  size?: number;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center shrink-0"
    >
      {photoURL ? (
        <img src={photoURL} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white/80 text-sm">
          {(name || "U").slice(0, 1)}
        </span>
      )}
    </div>
  );
}
