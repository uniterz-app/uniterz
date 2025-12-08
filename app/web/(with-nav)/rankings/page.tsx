// app/web/(with-nav)/rankings/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type {
  Period,
  LeagueTab,
  Metric,
  RankingRow,
  RankingResponse,
} from "@/lib/rankings/types";

/* =========================
 * Page
 * =======================*/
export default function WebRankingsPage() {
  const pathname = usePathname();
  const sectionPrefix: "/web" | "/mobile" =
    pathname?.startsWith("/mobile") ? "/mobile" : "/web";

  // 🟦 初期リーグ = NBA
  const [league, setLeague] = useState<LeagueTab>("nba");

  // 🟦 期間 = week / month
  const [period, setPeriod] = useState<Period>("week");

  // ランキングデータ
  const [rowsWinRate, setRowsWinRate] = useState<RankingRow[]>([]);
  const [rowsAccuracy, setRowsAccuracy] = useState<RankingRow[]>([]);
  const [rowsPrecision, setRowsPrecision] = useState<RankingRow[]>([]);
  const [rowsUpset, setRowsUpset] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const heroCount = 3;
  const listCount = 10;

  /* ========== ランキング取得 ========== */
  useEffect(() => {
    let cancelled = false;

    async function fetchRankings() {
      setLoading(true);

      try {
        const limit = 50;

        const makeUrl = (metric: Metric) =>
          `/api/rankings-v2?period=${period}&league=${league}&metric=${metric}&limit=${limit}`;

        // ⭐ 週間 = 2指標
        if (period === "week") {
          const [resWin, resAcc] = await Promise.all([
            fetch(makeUrl("winRate")),
            fetch(makeUrl("accuracy")),
          ]);

          if (!resWin.ok || !resAcc.ok) throw new Error("API error");

          const jsonWin = (await resWin.json()) as RankingResponse;
          const jsonAcc = (await resAcc.json()) as RankingResponse;

          if (!cancelled) {
            setRowsWinRate(jsonWin.rows ?? []);
            setRowsAccuracy(jsonAcc.rows ?? []);
            setRowsPrecision([]);
            setRowsUpset([]);
          }
        }

        // ⭐ 月間 = 4指標
        if (period === "month") {
          const [resWin, resAcc, resPre, resUpset] = await Promise.all([
            fetch(makeUrl("winRate")),
            fetch(makeUrl("accuracy")),
            fetch(makeUrl("avgPrecision")),
            fetch(makeUrl("avgUpset")),
          ]);

          if (!resWin.ok || !resAcc.ok || !resPre.ok || !resUpset.ok)
            throw new Error("API error");

          const jsonWin = (await resWin.json()) as RankingResponse;
          const jsonAcc = (await resAcc.json()) as RankingResponse;
          const jsonPre = (await resPre.json()) as RankingResponse;
          const jsonUps = (await resUpset.json()) as RankingResponse;

          if (!cancelled) {
            setRowsWinRate(jsonWin.rows ?? []);
            setRowsAccuracy(jsonAcc.rows ?? []);
            setRowsPrecision(jsonPre.rows ?? []);
            setRowsUpset(jsonUps.rows ?? []);
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setRowsWinRate([]);
          setRowsAccuracy([]);
          setRowsPrecision([]);
          setRowsUpset([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRankings();
    return () => {
      cancelled = true;
    };
  }, [period, league]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <TabsRow league={league} setLeague={setLeague} period={period} setPeriod={setPeriod} />

      {/* ========== 週間 ========== */}
      {period === "week" && (
        <>
          <Section title="勝率（週間）">
            <MetricSection
              rows={rowsWinRate}
              heroCount={heroCount}
              listCount={listCount}
              metric="winRate"
              sectionPrefix={sectionPrefix}
              league={league}
              loading={loading}
            />
          </Section>

          <Section title="正確性（週間）">
            <MetricSection
              rows={rowsAccuracy}
              heroCount={heroCount}
              listCount={listCount}
              metric="accuracy"
              sectionPrefix={sectionPrefix}
              league={league}
              loading={loading}
            />
          </Section>
        </>
      )}

      {/* ========== 月間 ========== */}
      {period === "month" && (
        <>
          <Section title="勝率（月間）">
            <MetricSection
              rows={rowsWinRate}
              heroCount={heroCount}
              listCount={listCount}
              metric="winRate"
              sectionPrefix={sectionPrefix}
              league={league}
              loading={loading}
            />
          </Section>

          <Section title="正確性（月間）">
            <MetricSection
              rows={rowsAccuracy}
              heroCount={heroCount}
              listCount={listCount}
              metric="accuracy"
              sectionPrefix={sectionPrefix}
              league={league}
              loading={loading}
            />
          </Section>

          <Section title="点差精度（月間）">
            <MetricSection
              rows={rowsPrecision}
              heroCount={heroCount}
              listCount={listCount}
              metric="avgPrecision"
              sectionPrefix={sectionPrefix}
              league={league}
              loading={loading}
            />
          </Section>

          <Section title="UPSET 指数（月間）">
            <MetricSection
              rows={rowsUpset}
              heroCount={heroCount}
              listCount={listCount}
              metric="avgUpset"
              sectionPrefix={sectionPrefix}
              league={league}
              loading={loading}
            />
          </Section>
        </>
      )}
    </div>
  );
}

/* =========================
 * Tabs（リーグは NBA / B1）
 * =======================*/
function TabsRow(props: {
  league: LeagueTab;
  setLeague: (v: LeagueTab) => void;
  period: Period;
  setPeriod: (v: Period) => void;
}) {
  const { league, setLeague, period, setPeriod } = props;

  const Tab = ({ label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={[
        "px-5 py-2.5 rounded-2xl border transition-colors",
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
      {/* 🟦 League Tabs */}
      <div className="flex gap-2">
        <Tab label="NBA" active={league === "nba"} onClick={() => setLeague("nba")} />
        <Tab label="B1"  active={league === "b1"}  onClick={() => setLeague("b1")} />
      </div>

      {/* 🟦 Period Tabs */}
      <div className="flex gap-2">
        <Tab label="週間" active={period === "week"} onClick={() => setPeriod("week")} />
        <Tab label="月間" active={period === "month"} onClick={() => setPeriod("month")} />
      </div>
    </div>
  );
}

/* =========================
 * Section wrapper
 * =======================*/
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="text-xl text-white font-extrabold text-center">{title}</h2>
      {children}
    </section>
  );
}

/* =========================
 * Metric Wrapper
 * =======================*/
function MetricSection({
  rows,
  heroCount,
  listCount,
  metric,
  sectionPrefix,
  league,
  loading,
}: any) {
  return loading && rows.length === 0 ? (
    <p className="text-white/60 text-sm">ランキングを読み込み中…</p>
  ) : rows.length === 0 ? (
    <p className="text-white/50 text-sm">対象期間のランキングデータがまだありません。</p>
  ) : (
    <>
      <HeroRow
        rows={rows}
        heroCount={heroCount}
        metric={metric}
        sectionPrefix={sectionPrefix}
        league={league}
      />
      <RankingList
        rows={rows.slice(heroCount, listCount)}
        metric={metric}
        baseRank={heroCount}
        sectionPrefix={sectionPrefix}
      />
    </>
  );
}


/* =========================
 * Hero Cards (Top5/Top3) — V2対応
 * UIは一切変更なし
 * =======================*/
function HeroRow({
  rows,
  heroCount,
  metric,
  sectionPrefix,
  league,
}: {
  rows: RankingRow[];
  heroCount: number;
  metric: Metric;
  sectionPrefix: "/web" | "/mobile";
  league: LeagueTab;
}) {
  const base = rows.slice(0, heroCount);
  const ORDER_5 = [3, 1, 0, 2, 4];
  const ORDER_3 = [1, 0, 2];
  const order = heroCount === 5 ? ORDER_5 : ORDER_3;
  const top = order.map((i) => base[i]).filter(Boolean);

  const cols = heroCount === 5 ? "grid-cols-5" : "grid-cols-3";

  const CARD_H = 360;
  const AVATAR_BOX_H = 190;

  return (
    <div className={`grid ${cols} gap-6 items-end`}>
      {top.map((r, i) => {
        const rank = (base.indexOf(r) ?? i) + 1;

        const ring = ringByRank(rank);
        const avatarSize = avatarSizeByRank(rank, heroCount);
        const { badgeWidth, badgeLift } = badgeDimsByRank(rank, avatarSize, heroCount);

        /* ============================
         * ★ V2仕様：表示値と色を切替え
         * ============================ */
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

        const chip =
          metric === "winRate"
            ? "bg-emerald-600 text-white"
            : metric === "accuracy"
            ? "bg-blue-600 text-white"
            : metric === "avgPrecision"
            ? "bg-purple-600 text-white"
            : metric === "avgUpset"
            ? "bg-orange-600 text-white"
            : "bg-gray-500 text-white";

        return (
          <a
            key={r.uid}
            href={`${sectionPrefix}/u/${encodeURIComponent(r.uid)}`}
            className={[
              "relative rounded-2xl border border-white/10 bg-white/[.04]",
              "px-4 pt-12 pb-5 flex flex-col items-center gap-0 overflow-visible",
              "hover:bg-white/[.06] transition-colors group",
              "shadow-[0_12px_40px_rgba(0,0,0,.25)]",
            ].join(" ")}
            style={{ height: CARD_H }}
          >
            {/* バッジ */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-20"
              style={{ top: -badgeLift, width: badgeWidth }}
            >
              <RankBadge
                rank={rank}
                size={badgeWidth}
                priority={rank === 1}
                league={league}
              />
            </div>

            {/* アバター */}
            <div
              className="w-full flex items-center justify-center"
              style={{ height: AVATAR_BOX_H }}
            >
              <div className="relative">
                <div
                  className={[
                    "rounded-full overflow-hidden ring-2 shadow-[0_10px_30px_rgba(0,0,0,.35)]",
                    ring.ring,
                  ].join(" ")}
                  style={{ width: avatarSize, height: avatarSize }}
                >
                  <Avatar name={r.displayName} photoURL={r.photoURL} size={avatarSize} />
                </div>
                <div
                  className={[
                    "absolute inset-0 rounded-full blur-xl pointer-events-none",
                    ring.glow,
                  ].join(" ")}
                />
              </div>
            </div>

            {/* 名前 */}
            <div className="text-white font-semibold text-base text-center max-w-[22ch] truncate h-7 flex items-center">
              {r.displayName}
            </div>

            {/* 値 */}
            <div className="h-10 mt-3 flex items-center">
              <span
                className={[
                  "px-4 py-1.5 rounded-2xl text-sm font-black tracking-tight",
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


/* 透過PNGのランクバッジ（/public/rankings/emblems/rank-*.png） */
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

// B1 / NBA は 1〜3 位だけ専用バッジ
if (league === "b1" && rank <= 3) {
  src = `/rankings/emblems/b1rank-${rank}.png`;
} else if (league === "nba" && rank <= 3) {
  src = `/rankings/emblems/nbarank-${rank}.png`;
} else {
  // 4〜5 位 + ALL は共通
  src = `/rankings/emblems/rank-${rank}.png`;
}


  return (
    <Image
      src={src}
      alt={`Rank ${rank}`}
      width={size}
      height={Math.round(size * 0.7)}
      priority={priority}
      style={{ width: size, height: "auto" }}
    />
  );
}


/* 視覚スタイル（リング/グロー） */
function ringByRank(rank: number) {
  if (rank === 1) return { ring: "ring-yellow-300", glow: "bg-yellow-300/25" };
  if (rank === 2) return { ring: "ring-slate-200",  glow: "bg-slate-200/20"  };
  if (rank === 3) return { ring: "ring-amber-600",  glow: "bg-amber-600/25"  };
  if (rank === 4) return { ring: "ring-cyan-300",   glow: "bg-cyan-300/25"   };
  return { ring: "ring-teal-300", glow: "bg-teal-300/25" };
}

/* アバターサイズ（約15〜25%縮小。1位は存在感キープ） */
function avatarSizeByRank(rank: number, heroCount: number) {
  if (heroCount === 5) {
    if (rank === 1) return 140;
    if (rank === 2) return 124;
    if (rank === 3) return 112;
    if (rank === 4) return 104;
    return 96;
  }
  if (rank === 1) return 132;
  if (rank === 2) return 118;
  return 108;
}

/* バッジの幅＆持ち上げ量（縮小後も“はみ出し”を維持） */
function badgeDimsByRank(
  rank: number,
  avatarSize: number,
  heroCount: number
): { badgeWidth: number; badgeLift: number } {
  const isTop3 = heroCount === 3;

  const widthScale: Record<number, number> = {
    1: isTop3 ? 1.40 : 1.50,
    2: isTop3 ? 1.20 : 1.28,
    3: isTop3 ? 1.06 : 1.14,
    4: isTop3 ? 0.98 : 1.06,
    5: isTop3 ? 0.92 : 1.00,
  };

  const liftScale: Record<number, number> = {
    1: 0.34,
    2: 0.28,
    3: 0.22,
    4: 0.20,
    5: 0.16,
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
 * List (Top20/Top10) — V2対応版
 * UIは絶対変更しない
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
    <div className="mx-auto max-w-4xl rounded-2xl border border-white/12 bg-white/[.04] overflow-hidden">
      {rows.map((r, i) => {
        const rank = baseRank + i + 1;

        /* ============================
         * ★ V2仕様：表示値の切替え
         * ============================ */
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

        /* ============================
         * ★ V2仕様：chip 色の切替え
         * ============================ */
        const chip =
          metric === "winRate"
            ? "bg-emerald-600 text-white"
            : metric === "accuracy"
            ? "bg-blue-600 text-white"
            : metric === "avgPrecision"
            ? "bg-purple-600 text-white"
            : metric === "avgUpset"
            ? "bg-orange-600 text-white"
            : "bg-gray-500 text-white";

        return (
          <a
            key={r.uid}
            href={`${sectionPrefix}/u/${encodeURIComponent(r.uid)}`}
            className="flex items-center px-5 py-5 hover:bg-white/[.06]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <RankCircle rank={rank} />
              <Avatar name={r.displayName} photoURL={r.photoURL} size={48} />
              <div className="text-white text-base font-semibold min-w-0 truncate">
                {r.displayName}
              </div>
            </div>

            <span
              className={[
                "ml-auto px-3.5 py-1.5 rounded-2xl text-sm font-black tracking-tight",
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
 * RankCircle（UIそのまま）
 * =======================*/
function RankCircle({ rank }: { rank: number }) {
  return (
    <div className="w-9 h-9 rounded-full grid place-items-center text-sm font-extrabold border border-amber-300/60 text-amber-300/95">
      {rank}
    </div>
  );
}

/* =========================
 * Avatar（UIそのまま）
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
