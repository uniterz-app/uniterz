// app/web/(with-nav)/rankings/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Alfa_Slab_One } from "next/font/google";

import type {
  Period,
  LeagueTab,
  Metric,
  RankingRow,
} from "@/lib/rankings/types";

const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
});

/* =========================
 * Page
 * =======================*/
export default function WebRankingsPage() {
  const pathname = usePathname();
  const sectionPrefix: "/web" | "/mobile" =
    pathname?.startsWith("/mobile") ? "/mobile" : "/web";

  const [league, setLeague] = useState<LeagueTab>("nba");
  const [period, setPeriod] = useState<Period>("week");

  const [rows, setRows] = useState<Record<Metric, RankingRow[]>>({
    winRate: [],
    accuracy: [],
    avgPrecision: [],
    avgUpset: [],
    consistency: [],
  });

  const [periodInfo, setPeriodInfo] = useState<{
    startAt: string;
    endAt: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const heroCount = 5;
  const listCount = 10;

  /* =========================
   * Fetch
   * =======================*/
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setPeriodInfo(null);

      try {
        const metrics: Metric[] = [
          "winRate",
          "accuracy",
          "avgPrecision",
          "avgUpset",
          "consistency",
        ];

        const results = await Promise.all(
          metrics.map(async (metric) => {
            const res = await fetch(
              `/api/rankings-v2?period=${period}&league=${league}&metric=${metric}`
            );
            const json = await res.json();
            return [metric, json.rows ?? []] as const;
          })
        );

        if (cancelled) return;

        setRows((prev) => {
          const next = { ...prev };
          for (const [metric, r] of results) next[metric] = r;
          return next;
        });

        if (results[0]?.[1]?.length && results[0][1][0].period) {
          setPeriodInfo(results[0][1][0].period);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [league, period]);

  const noData = Object.values(rows).every((r) => r.length === 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <TabsRow
        league={league}
        setLeague={setLeague}
        period={period}
        setPeriod={setPeriod}
      />

      {/* 集計期間 */}
      {periodInfo && (
        <div className="text-center text-xs text-white/60">
          集計期間：
          {new Date(periodInfo.startAt).toLocaleDateString("ja-JP", {
            month: "numeric",
            day: "numeric",
          })}
          {" 〜 "}
          {new Date(periodInfo.endAt).toLocaleDateString("ja-JP", {
            month: "numeric",
            day: "numeric",
          })}
        </div>
      )}

      {loading && <p className="text-center text-white/60">読み込み中…</p>}

      {!loading && noData && (
        <p className="text-center text-white/60">
          ランキングデータがありません。
        </p>
      )}

      {!loading &&
        (Object.entries(rows) as [Metric, RankingRow[]][]).map(
          ([metric, r]) => (
            <Section key={metric} title={metricLabel(metric)}>
              <HeroRow
                rows={r}
                heroCount={heroCount}
                metric={metric}
                sectionPrefix={sectionPrefix}
              />
              <RankingList
                rows={r.slice(heroCount, listCount)}
                metric={metric}
                baseRank={heroCount}
                sectionPrefix={sectionPrefix}
              />
            </Section>
          )
        )}
    </div>
  );
}

/* =========================
 * Tabs
 * =======================*/
function TabsRow({
  league,
  setLeague,
  period,
  setPeriod,
}: {
  league: LeagueTab;
  setLeague: (v: LeagueTab) => void;
  period: Period;
  setPeriod: (v: Period) => void;
}) {
  const Tab = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={[
        "px-5 py-2.5 rounded-2xl border text-sm",
        active
          ? "bg-white/12 border-white/30 text-white font-semibold"
          : "bg-white/5 border-white/10 text-white/70",
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
 * Section
 * =======================*/
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl text-white font-extrabold text-center">{title}</h2>
      {children}
    </section>
  );
}

/* =========================
 * HeroRow
 * =======================*/
function HeroRow({
  rows,
  heroCount,
  metric,
  sectionPrefix,
}: {
  rows: RankingRow[];
  heroCount: number;
  metric: Metric;
  sectionPrefix: "/web" | "/mobile";
}) {
  const base = rows.slice(0, heroCount);
  const ORDER_5 = [3, 1, 0, 2, 4];
  const top = ORDER_5.map((i) => base[i]).filter(Boolean);

  return (
    <div className="grid grid-cols-5 gap-6 items-end">
      {top.map((r, i) => {
        const rank = base.indexOf(r) + 1;
        const value = metricValue(metric, r);

        return (
          <a
            key={r.uid}
            href={`${sectionPrefix}/u/${r.handle}`}
            className="relative rounded-2xl border border-white/10 bg-white/[.04] px-4 pt-12 pb-5 flex flex-col items-center"
            style={{ height: 360 }}
          >
            <RankBadge rank={rank} />

            <div className="mt-10">
              <Avatar photoURL={r.photoURL} size={rank === 1 ? 140 : 110} />
            </div>

            <div className="mt-3 text-white font-semibold truncate">
              {r.displayName}
            </div>

            <div className="mt-3 flex flex-col items-center">
              <span className={`${alfa.className} text-xl`}>
                {value}
              </span>
              <span className="text-xs text-white/40">
                {r.posts} 投稿
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

/* =========================
 * RankingList
 * =======================*/
function RankingList({
  rows,
  metric,
  baseRank,
  sectionPrefix,
}: {
  rows: RankingRow[];
  metric: Metric;
  baseRank: number;
  sectionPrefix: "/web" | "/mobile";
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[.04] divide-y divide-white/10">
      {rows.map((r, i) => {
        const rank = baseRank + i + 1;
        const value = metricValue(metric, r);

        return (
          <a
            key={r.uid}
            href={`${sectionPrefix}/u/${r.handle}`}
            className="flex items-center px-5 py-5"
          >
            <RankCircle rank={rank} />
            <Avatar photoURL={r.photoURL} size={48} />
            <div className="ml-3 text-white font-semibold truncate">
              {r.displayName}
            </div>

            <div className="ml-auto text-right">
              <div className={`${alfa.className} text-lg`}>{value}</div>
              <div className="text-xs text-white/40">{r.posts} 投稿</div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

/* =========================
 * Utils
 * =======================*/
function metricValue(metric: Metric, r: RankingRow) {
  if (metric === "winRate") return `${Math.round((r.winRate ?? 0) * 100)}%`;
  if (metric === "accuracy") return `${Math.round(r.accuracy ?? 0)}%`;
  if (metric === "avgPrecision") return `${(r.avgPrecision ?? 0).toFixed(1)}`;
  if (metric === "avgUpset") return `${(r.avgUpset ?? 0).toFixed(1)}`;
  if (metric === "consistency") return `${Math.round((r.consistency ?? 0) * 100)}%`;
  return "-";
}

function metricLabel(metric: Metric) {
  if (metric === "winRate") return "勝率";
  if (metric === "accuracy") return "予測精度";
  if (metric === "avgPrecision") return "スコア精度";
  if (metric === "avgUpset") return "Upset指数";
  if (metric === "consistency") return "一致度";
  return metric;
}

/* =========================
 * Small Components
 * =======================*/
function RankBadge({ rank }: { rank: number }) {
  if (rank > 5) return null;
  return (
    <Image
      src={`/rankings/emblems/rank-${rank}.png`}
      alt={`Rank ${rank}`}
      width={64}
      height={45}
    />
  );
}

function RankCircle({ rank }: { rank: number }) {
  return (
    <div className="w-9 h-9 mr-3 rounded-full grid place-items-center text-sm font-bold border border-amber-300/60 text-amber-300">
      {rank}
    </div>
  );
}

function Avatar({
  photoURL,
  size,
}: {
  photoURL?: string;
  size: number;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-white/10 border border-white/10 overflow-hidden"
    >
      {photoURL && (
        <img src={photoURL} className="w-full h-full object-cover" />
      )}
    </div>
  );
}
