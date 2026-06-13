"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MyRankCardFrame } from "@/app/component/rankings/MyRankCardFrame";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
import ProfileEditTronAvatar from "./ProfileEditTronAvatar";
import {
  PROFILE_EDIT_TRON_MOCK,
  type ProfileEditTronIdentity,
  type ProfileEditTronStats,
} from "./profileEditTronTypes";
import { jp, nameBebas, nameOxanium, nameRajdhani, summaryMetricNumClass } from "@/lib/fonts";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";

const CYAN_ACCENT = {
  border: "rgba(34,211,238,0.55)",
  glow: "rgba(34,211,238,0.35)",
  bg: "rgba(34,211,238,0.14)",
};

type StatKey =
  | "winRate"
  | "posts"
  | "hits"
  | "scorePrecision"
  | "totalPoints"
  | "upset";

type StatCell = {
  key: StatKey;
  labelJa: string;
  labelEn: string;
  value: string;
  pct: number;
};

function buildStatCells(stats: ProfileEditTronStats): StatCell[] {
  return [
    {
      key: "winRate",
      labelJa: "勝率",
      labelEn: "WIN%",
      value: `${formatMetricDecimals(stats.winRate, 1)}%`,
      pct: Math.min(100, stats.winRate),
    },
    {
      key: "posts",
      labelJa: "投稿数",
      labelEn: "POSTS",
      value: String(stats.posts),
      pct: Math.min(100, (stats.posts / 60) * 100),
    },
    {
      key: "hits",
      labelJa: "的中数",
      labelEn: "HITS",
      value: String(stats.hits),
      pct: stats.posts > 0 ? Math.min(100, (stats.hits / stats.posts) * 100) : 0,
    },
    {
      key: "scorePrecision",
      labelJa: "スコア精度",
      labelEn: "PRECISION",
      value: formatMetricDecimals(stats.scorePrecision, 1),
      pct: Math.min(100, (stats.scorePrecision / 400) * 100),
    },
    {
      key: "totalPoints",
      labelJa: "総合得点",
      labelEn: "TOTAL PTS",
      value: stats.totalPoints.toLocaleString(),
      pct: Math.min(100, (stats.totalPoints / 1600) * 100),
    },
    {
      key: "upset",
      labelJa: "アップセット",
      labelEn: "UPSET",
      value: formatMetricDecimals(stats.upset, 1),
      pct: Math.min(100, (stats.upset / 120) * 100),
    },
  ];
}

type Props = {
  layout: "web" | "mobile";
  identity?: ProfileEditTronIdentity;
  stats?: ProfileEditTronStats;
  language?: "ja" | "en";
  editable?: boolean;
};

function IdentityTower({
  identity,
  layout,
  editable,
}: {
  identity: ProfileEditTronIdentity;
  layout: "web" | "mobile";
  editable?: boolean;
}) {
  const compact = layout === "mobile";

  return (
    <div
      className={[
        "flex h-full flex-col items-center bg-[#040a10]/80",
        compact
          ? "gap-4 border-b border-cyan-400/12 px-4 py-5"
          : "gap-5 border-r border-cyan-400/12 px-5 py-6",
      ].join(" ")}
    >
      <ProfileEditTronAvatar
        photoURL={identity.photoURL}
        displayName={identity.displayName}
        size={layout}
        editable={editable}
      />

      <div className="w-full text-center">
        <p
          className={[
            nameRajdhani.className,
            "tracking-[0.22em] text-cyan-300/75 uppercase",
            compact ? "text-[10px]" : "text-[11px]",
          ].join(" ")}
        >
          SYSTEM ID: {identity.systemId}
        </p>
        <h2
          className={[
            nameBebas.className,
            "mt-1 tracking-[0.06em] text-white",
            compact ? "text-[32px] leading-none" : "text-[38px] leading-none",
          ].join(" ")}
        >
          {identity.displayName}
        </h2>
        <p
          className={[
            nameOxanium.className,
            "mt-1 text-cyan-200/55",
            compact ? "text-[11px]" : "text-xs",
          ].join(" ")}
        >
          @{identity.handle}
        </p>
        {identity.statusLabel ? (
          <div className="mt-3 inline-flex border border-cyan-400/30 bg-cyan-400/6 px-3 py-1">
            <span
              className={[
                nameRajdhani.className,
                "text-[10px] font-semibold tracking-[0.18em] text-cyan-200/90 uppercase",
              ].join(" ")}
            >
              {identity.statusLabel}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-auto w-full">
        <p
          className={[
            nameRajdhani.className,
            "mb-2 text-[10px] font-semibold tracking-[0.2em] text-cyan-300/70 uppercase",
          ].join(" ")}
        >
          GRID REPUTATION
        </p>
        <CyberSlantedSegBar
          pct={identity.reputationPct ?? 0}
          segments={10}
          tall
          accent={CYAN_ACCENT}
          maxWidthClass="max-w-none"
        />
      </div>
    </div>
  );
}

function StatCellView({
  cell,
  language,
  index,
  reduceMotion,
}: {
  cell: StatCell;
  language: "ja" | "en";
  index: number;
  reduceMotion: boolean;
}) {
  const label = language === "ja" ? cell.labelJa : cell.labelEn;

  return (
    <motion.div
      className="profile-edit-tron-stat-cell relative border border-cyan-400/14 bg-[#061018]/90 p-3"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <p
        className={[
          nameRajdhani.className,
          "text-[10px] font-semibold tracking-[0.16em] text-cyan-300/72 uppercase",
        ].join(" ")}
      >
        {label}
      </p>
      <p
        className={[
          summaryMetricNumClass,
          "mt-1 text-[22px] leading-none text-white",
        ].join(" ")}
      >
        {cell.value}
      </p>
      <div className="mt-2.5">
        <CyberSlantedSegBar
          pct={cell.pct}
          segments={8}
          compact
          enterDelay={0.12 + index * 0.04}
          accent={CYAN_ACCENT}
          maxWidthClass="max-w-none"
        />
      </div>
    </motion.div>
  );
}

function StatsTower({
  stats,
  layout,
  language,
}: {
  stats: ProfileEditTronStats;
  layout: "web" | "mobile";
  language: "ja" | "en";
}) {
  const reduceMotion = useReducedMotion() === true;
  const cells = useMemo(() => buildStatCells(stats), [stats]);
  const compact = layout === "mobile";

  return (
    <div
      className={[
        "flex h-full flex-col bg-[#050c12]/75",
        compact ? "gap-3 p-4" : "gap-4 p-5",
      ].join(" ")}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p
            className={[
              nameRajdhani.className,
              "text-[10px] font-semibold tracking-[0.22em] text-cyan-300/65 uppercase",
            ].join(" ")}
          >
            {language === "ja" ? "戦績モジュール" : "COMBAT METRICS"}
          </p>
          <p className={[jp.className, "mt-0.5 text-[11px] text-white/45"].join(" ")}>
            {language === "ja"
              ? "プレイオフ期間の集計プレビュー"
              : "Playoff phase aggregate preview"}
          </p>
        </div>
        <div
          className={[
            nameOxanium.className,
            "shrink-0 border border-cyan-400/22 px-2 py-1 text-[9px] tracking-widest text-cyan-200/65 uppercase",
          ].join(" ")}
        >
          SYNC OK
        </div>
      </div>

      <div
        className={[
          "grid flex-1 gap-2.5",
          compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3",
        ].join(" ")}
      >
        {cells.map((cell, i) => (
          <StatCellView
            key={cell.key}
            cell={cell}
            language={language}
            index={i}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>

      <div
        className={[
          nameRajdhani.className,
          "flex flex-wrap items-center justify-between gap-2 border-t border-cyan-400/10 pt-3 text-[9px] tracking-[0.14em] text-cyan-300/45 uppercase",
        ].join(" ")}
      >
        <span>KERNEL: 4.19.0-DISC-OPTIMIZED</span>
        <span>LAST_SYNCH: 0X4FF82_A9</span>
      </div>
    </div>
  );
}

export default function ProfileEditTronPanel({
  layout,
  identity = PROFILE_EDIT_TRON_MOCK.identity,
  stats = PROFILE_EDIT_TRON_MOCK.stats,
  language = "ja",
  editable = false,
}: Props) {
  const isMobileLayout = layout === "mobile";

  return (
    <MyRankCardFrame tone="neutral" className="overflow-hidden">
      <div
        className={[
          "profile-edit-tron-panel grid min-h-[420px]",
          isMobileLayout
            ? "grid-cols-1 grid-rows-[auto_1fr]"
            : "grid-cols-[minmax(200px,240px)_1fr]",
        ].join(" ")}
      >
        <IdentityTower
          identity={identity}
          layout={layout}
          editable={editable}
        />
        <StatsTower stats={stats} layout={layout} language={language} />
      </div>
    </MyRankCardFrame>
  );
}
