"use client";

/**
 * /dev/my-rank-card-focus-preview
 * 総合スコアタブ時の MyRankCard — 案B たたき台プレビュー
 */

import { useState } from "react";
import { jp, nameBebas, nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import {
  MyRankCardFrame,
  resolveMyRankCardFrameTone,
  type MyRankCardFrameTone,
} from "@/app/component/rankings/MyRankCardFrame";
import { RANKINGS_CYAN } from "@/lib/rankings/rankingsCyberTheme";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
import { RankDeltaBadge } from "@/app/component/rankings/RankDeltaBadge";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import { listRowAvgText } from "@/lib/rankings/listRowMetricMeta";

const LIME = "#b8ff3c";
const LIME_DIM = "rgba(184,255,60,0.35)";
const LIME_GLOW = "rgba(184,255,60,0.55)";
const CYAN = RANKINGS_CYAN;
const CYAN_DIM = "rgba(34,211,238,0.35)";
const CYAN_GLOW = "rgba(34,211,238,0.55)";
const GOLD = "#FFD65A";
const TOP_PERCENT_SHOW_MAX = 50;

function focusCardAccent(tone: MyRankCardFrameTone) {
  if (tone === "down") {
    return {
      primary: CYAN,
      dim: CYAN_DIM,
      glow: CYAN_GLOW,
      hairline: "rgba(34,211,238,0.22)",
      towerBg:
        "linear-gradient(180deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 55%, transparent 100%)",
      avatarBg: "rgba(34,211,238,0.05)",
    };
  }
  if (tone === "neutral") {
    return {
      primary: "#CBD5E1",
      dim: "rgba(148,163,184,0.25)",
      glow: "rgba(148,163,184,0.35)",
      hairline: "rgba(255,255,255,0.12)",
      towerBg:
        "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 55%, transparent 100%)",
      avatarBg: "rgba(255,255,255,0.03)",
    };
  }
  return {
    primary: LIME,
    dim: LIME_DIM,
    glow: LIME_GLOW,
    hairline: "rgba(184,255,60,0.18)",
    towerBg:
      "linear-gradient(180deg, rgba(184,255,60,0.07) 0%, rgba(184,255,60,0.02) 55%, transparent 100%)",
    avatarBg: "rgba(184,255,60,0.04)",
  };
}

type FocusMock = {
  displayName: string;
  rank: number;
  rankDeltaPlaces: number;
  totalEntries: number;
  totalScore: number;
  dayDeltaPts: number;
  /** 投稿数 — リスト行 VOL と同じ */
  posts: number;
  /** 平均スコア — リスト行 AVG と同じ */
  avgTotalScore: number;
  leaderPct: number;
  leaderScore: number;
  photoURL: string | null;
};

const BASE_MOCK: FocusMock = {
  displayName: "SYNTAX_ERROR",
  rank: 14,
  rankDeltaPlaces: 3,
  totalEntries: 1882,
  totalScore: 1284,
  dayDeltaPts: 12,
  posts: 41,
  avgTotalScore: 31.3,
  leaderPct: 68,
  leaderScore: 1888,
  photoURL: null,
};

function formatPts(n: number) {
  return n.toLocaleString("en-US");
}

/** 本番 MyRankCard と同じ TOP ◯% 算出 */
function computeTopPercent(rank: number, totalEntries: number): string | null {
  if (totalEntries <= 0 || rank < 1) return null;
  const pct = (rank / totalEntries) * 100;
  if (pct > TOP_PERCENT_SHOW_MAX) return null;
  const clamped = Math.min(TOP_PERCENT_SHOW_MAX, Math.max(0.1, pct));
  return clamped < 10 ? clamped.toFixed(1) : String(Math.round(clamped));
}

function formatDayDelta(delta: number): string {
  const abs = Math.abs(delta).toFixed(1);
  if (delta > 0) return `+${abs}`;
  if (delta < 0) return `-${abs}`;
  return "±0.0";
}

function DayDeltaValue({
  delta,
  size,
  accentPrimary,
}: {
  delta: number;
  size: string;
  accentPrimary: string;
}) {
  const up = delta > 0;
  const down = delta < 0;
  const color = up ? accentPrimary : down ? CYAN : "rgba(255,255,255,0.45)";

  return (
    <span
      className={[summaryMetricNumClass, "leading-none tabular-nums"].join(" ")}
      style={{ fontSize: size, color }}
    >
      {formatDayDelta(delta)}
    </span>
  );
}

function AvatarBox({
  mock,
  accent,
  size = "md",
}: {
  mock: FocusMock;
  accent: ReturnType<typeof focusCardAccent>;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const text =
    size === "lg" ? "text-[14px]" : size === "sm" ? "text-[10px]" : "text-[12px]";

  return (
    <div
      className={["relative shrink-0 overflow-hidden rounded-sm", box].join(" ")}
      style={{
        border: `1px solid ${accent.hairline}`,
        background: accent.avatarBg,
      }}
    >
      <RankingsAvatarCircle
        photoURL={mock.photoURL}
        displayName={mock.displayName}
        boxClassName="h-full w-full"
        initialTextClassName={text}
        gateReady
        shape="square"
      />
    </div>
  );
}

function FocusSegBar({
  pct,
  cardAccent,
}: {
  pct: number;
  cardAccent: ReturnType<typeof focusCardAccent>;
}) {
  return (
    <CyberSlantedSegBar
      pct={pct}
      segments={12}
      compact
      enter
      accent={{
        border: cardAccent.primary,
        glow: cardAccent.glow,
        bg: cardAccent.dim,
      }}
      maxWidthClass="max-w-full"
    />
  );
}

/** ランキングリスト行と同じ VOL / AVG メタ */
function UsernameListMeta({
  posts,
  avgTotalScore,
  isWeb,
}: {
  posts: number;
  avgTotalScore: number;
  isWeb: boolean;
}) {
  const metaSize = isWeb ? 13 : 11;
  const avgText = listRowAvgText("totalScore", { avgTotalScore });

  return (
    <div
      className={[
        "mt-1.5 flex min-w-0 items-center gap-1.5",
        isWeb ? "mt-2 gap-2" : "",
      ].join(" ")}
    >
      <span
        className={[
          nameOxanium.className,
          "shrink-0 font-bold uppercase tracking-[0.14em] tabular-nums leading-none",
        ].join(" ")}
        style={{ color: "rgba(255,255,255,0.42)", fontSize: metaSize }}
      >
        VOL:{posts}
      </span>
      {avgText ? (
        <span
          className={[
            nameOxanium.className,
            "min-w-0 truncate font-bold uppercase tracking-[0.12em] tabular-nums leading-none",
          ].join(" ")}
          style={{ color: "rgba(0,245,255,0.55)", fontSize: metaSize }}
        >
          {avgText}
        </span>
      ) : null}
    </div>
  );
}

/** 案B — SYNTAX PANEL たたき台 */
function CardSyntaxPanel({
  mock,
  layout = "mobile",
}: {
  mock: FocusMock;
  layout?: "mobile" | "web";
}) {
  const frameTone = resolveMyRankCardFrameTone(mock.rankDeltaPlaces);
  const accent = focusCardAccent(frameTone);
  const isWeb = layout === "web";
  const towerW = isWeb ? "grid-cols-[120px_1fr]" : "grid-cols-[100px_1fr]";
  const rankSize = isWeb ? "58px" : "50px";
  const entriesSize = isWeb ? "11px" : "10px";
  const nameSize = isWeb ? "17px" : "15px";
  const statValueSize = isWeb ? "24px" : "22px";
  const dayDeltaSize = isWeb ? "15px" : "14px";
  const avatarSize = isWeb ? "md" : "sm";
  const topPercent = computeTopPercent(mock.rank, mock.totalEntries);

  return (
    <MyRankCardFrame
      tone={frameTone}
      className={[
        "w-full overflow-hidden",
        isWeb ? "max-w-[500px]" : "max-w-[440px]",
      ].join(" ")}
    >
      <div className={["grid", towerW].join(" ")}>
        {/* 左: YOUR RANK 塔（幅広） */}
        <div
          className="flex min-h-full flex-col items-center justify-between gap-1 px-1.5 py-2.5"
          style={{
            borderRight: `1px solid ${accent.hairline}`,
            background: accent.towerBg,
          }}
        >
          {topPercent ? (
            <span
              className={[
                "rounded px-1.5 py-[2px] font-bold tracking-wide",
                nameOxanium.className,
              ].join(" ")}
              style={{
                fontSize: isWeb ? "9px" : "8px",
                color: GOLD,
                background: "rgba(255,214,90,0.08)",
              }}
            >
              TOP {topPercent}%
            </span>
          ) : null}

          <span
            className={[
              nameOxanium.className,
              "whitespace-nowrap text-center font-bold uppercase tracking-[0.14em] text-white/42",
            ].join(" ")}
            style={{ fontSize: isWeb ? "8px" : "7.5px" }}
          >
            YOUR RANK
          </span>

          <div className="flex items-end justify-center gap-1">
            <span
              className={[nameBebas.className, "leading-[0.86] tabular-nums"].join(" ")}
              style={{
                fontSize: rankSize,
                color: accent.primary,
                filter: `drop-shadow(0 0 14px ${accent.glow})`,
              }}
            >
              {mock.rank}
            </span>
            <RankDeltaBadge
              delta={mock.rankDeltaPlaces}
              size={isWeb ? "md" : "sm"}
              language="ja"
            />
          </div>

          <span
            className={[
              nameOxanium.className,
              "font-medium tabular-nums text-white/38",
            ].join(" ")}
            style={{ fontSize: entriesSize }}
          >
            / {formatPts(mock.totalEntries)}
          </span>
        </div>

        {/* 右 */}
        <div className="flex min-h-full min-w-0 flex-col px-2.5 py-2.5">
          <div className="flex items-start gap-2">
            <div className="relative shrink-0">
              <AvatarBox mock={mock} accent={accent} size={avatarSize} />
            </div>

            {/* ユーザー名 — アバター上端に揃え + リスト同様 VOL/AVG */}
            <div className="min-w-0 flex-1 self-start truncate -mt-1 pr-1">
              <div
                className={[jp.className, "truncate font-black leading-none text-white"].join(" ")}
                style={{ fontSize: nameSize }}
              >
                {mock.displayName}
              </div>
              <UsernameListMeta
                posts={mock.posts}
                avgTotalScore={mock.avgTotalScore}
                isWeb={isWeb}
              />
            </div>

            {/* スタッツ — 縦積み・右寄せ */}
            <div className="ml-auto shrink-0 border-l border-white/8 pl-2.5 text-right">
              <span
                className={[
                  nameOxanium.className,
                  "block font-semibold uppercase tracking-[0.12em] text-white/38",
                ].join(" ")}
                style={{ fontSize: "7px" }}
              >
                TOTAL PTS
              </span>
              <span
                className={[
                  summaryMetricNumClass,
                  "mt-1 block leading-none tabular-nums text-white",
                ].join(" ")}
                style={{ fontSize: statValueSize }}
              >
                {formatPts(mock.totalScore)}
              </span>
              <div className="mt-1">
                <DayDeltaValue
                  delta={mock.dayDeltaPts}
                  size={dayDeltaSize}
                  accentPrimary={accent.primary}
                />
              </div>
            </div>
          </div>

          <div className="mt-auto pt-3">
            <FocusSegBar pct={mock.leaderPct} cardAccent={accent} />
          </div>
        </div>
      </div>

      <div
        className="px-2.5 py-1"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span
          className={[
            nameOxanium.className,
            "block truncate font-medium uppercase tracking-[0.18em] text-white/26",
          ].join(" ")}
          style={{ fontSize: "7px" }}
        >
          UNITERZ · TOTAL SCORE
        </span>
      </div>
    </MyRankCardFrame>
  );
}

function PreviewSection({
  tag,
  title,
  points,
  children,
}: {
  tag: string;
  title: string;
  points: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/10 px-4 py-7">
      <div className="mx-auto max-w-[480px]">
        <div className="flex items-baseline gap-2.5">
          <span className={`${nameBebas.className} text-[26px] leading-none text-[#b8ff3c]/80`}>
            {tag}
          </span>
          <h2 className={`${jp.className} text-[16px] font-black text-white/95`}>{title}</h2>
        </div>
        <ul
          className={`${jp.className} mt-1.5 space-y-0.5 text-[11.5px] leading-relaxed text-white/50`}
        >
          {points.map((p) => (
            <li key={p}>・{p}</li>
          ))}
        </ul>
        <div className="mt-4 flex justify-center">{children}</div>
      </div>
    </section>
  );
}

export default function MyRankCardFocusPreviewPage() {
  const [scenario, setScenario] = useState<"up" | "down" | "flat">("up");

  const mock: FocusMock =
    scenario === "up"
      ? BASE_MOCK
      : scenario === "down"
        ? { ...BASE_MOCK, rankDeltaPlaces: -2, dayDeltaPts: -8, rank: 22 }
        : { ...BASE_MOCK, rankDeltaPlaces: 0, dayDeltaPts: 0, rank: 14 };

  return (
    <main
      className="min-h-screen pb-24 text-white"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #0c1626 0%, #070b14 55%, #05080f 100%)",
      }}
    >
      <header className="px-4 pb-1 pt-9 text-center">
        <div
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.3em] text-[#b8ff3c]/70`}
        >
          MyRankCard — 案B たたき台
        </div>
        <h1 className={`${jp.className} mt-2 text-[20px] font-black`}>
          総合スコア専用カード（SYNTAX PANEL）
        </h1>
        <p className={`${jp.className} mt-1 text-[12px] text-white/45`}>
          順位↑=ライム枠 · 順位↓=シアン枠 · 変動なし=ニュートラル枠
        </p>

        <div className={`${jp.className} mt-3 flex justify-center gap-2 text-[11px]`}>
          {(
            [
              ["up", "順位↑ / PTS↑"],
              ["down", "順位↓ / PTS↓"],
              ["flat", "変動なし"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setScenario(key)}
              className={[
                "rounded border px-2.5 py-1 font-semibold transition-colors",
                scenario === key
                  ? "border-[#b8ff3c]/50 bg-[#b8ff3c]/10 text-[#b8ff3c]"
                  : "border-white/15 text-white/45 hover:border-white/25",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <PreviewSection
        tag="B"
        title="Mobile — ランキング一覧上"
        points={[
          "左塔 108px — YOUR RANK / 順位 / 母数 / 順位変動 / TOP ◯%",
          "ユーザー名下に VOL:投稿数 · AVG（リスト行と同スタイル）",
          "TOTAL PTS → 数字 → +12.0 を右列に縦積み",
          "塔・順位数字・セグバーも枠トーンに連動",
        ]}
      >
        <CardSyntaxPanel mock={mock} layout="mobile" />
      </PreviewSection>

      <PreviewSection
        tag="B′"
        title="Web — 塔 128px"
        points={["塔・順位数字をさらに拡大", "構成は mobile と同一"]}
      >
        <CardSyntaxPanel mock={mock} layout="web" />
      </PreviewSection>

      <footer className={`${jp.className} px-4 pt-2 text-center text-[11px] text-white/35`}>
        /dev/my-rank-card-focus-preview
      </footer>
    </main>
  );
}
