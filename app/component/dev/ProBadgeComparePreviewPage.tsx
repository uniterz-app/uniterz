"use client";

/**
 * /dev/pro-badge-compare · /mobile/pro-badge-compare
 * 現行（UNITERZ PRO タグ画像）と旧（ダイヤモンド + PRO）を並べて比較。
 */
import type { ReactNode } from "react";
import {
  CyberRankingListRow,
  CyberRankingScore,
} from "@/app/component/rankings/CyberRankingListParts";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import {
  ProCyberBadgeLegacy,
  proBadgeLegacyStaticMotion,
} from "@/app/component/common/ProCyberBadgeLegacy";
import UniterzProBadge from "@/app/component/units/UniterzProBadge";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import { cyberMetricTag } from "@/lib/rankings/cyberRankVisual";

type BadgeKind = "current" | "legacy";

const MOCK_ROWS: Array<{
  rank: number;
  displayName: string;
  photoURL: string | null;
  points: number;
  posts: number;
  isPro: boolean;
  countryCode: string;
}> = [
  {
    rank: 1,
    displayName: "KAMIYA",
    photoURL: null,
    points: 12840,
    posts: 42,
    isPro: true,
    countryCode: "JP",
  },
  {
    rank: 2,
    displayName: "RIKU",
    photoURL: null,
    points: 11210,
    posts: 38,
    isPro: true,
    countryCode: "JP",
  },
  {
    rank: 3,
    displayName: "NOVA",
    photoURL: null,
    points: 9980,
    posts: 35,
    isPro: false,
    countryCode: "US",
  },
  {
    rank: 4,
    displayName: "SHADOW",
    photoURL: null,
    points: 8740,
    posts: 31,
    isPro: true,
    countryCode: "KR",
  },
  {
    rank: 5,
    displayName: "FREE_PLAYER",
    photoURL: null,
    points: 7600,
    posts: 28,
    isPro: false,
    countryCode: "JP",
  },
];

function labelClass(on = false) {
  return [
    nameOxanium.className,
    "text-[10px] font-bold uppercase tracking-[0.18em]",
    on ? "text-white/55" : "text-white/35",
  ].join(" ");
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-white/10 bg-black/40 px-3 py-4 sm:px-4">
      <p className={labelClass(true)}>{title}</p>
      {hint ? (
        <p className="mt-1 text-[12px] leading-relaxed text-white/40">{hint}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function NameWithBadge({
  kind,
  size,
}: {
  kind: BadgeKind;
  size: "premium" | "emphasized" | "compact" | "default";
}) {
  const badge =
    kind === "current" ? (
      <ProCyberBadge
        {...proBadgeStaticMotion}
        ariaLabel="UNITERZ Pro"
        premium={size === "premium"}
        emphasized={size === "emphasized"}
        compact={size === "compact"}
      />
    ) : (
      <ProCyberBadgeLegacy
        {...proBadgeLegacyStaticMotion}
        ariaLabel="UNITERZ Pro"
        premium={size === "premium"}
        emphasized={size === "emphasized"}
        compact={size === "compact"}
      />
    );

  const textSize =
    size === "premium"
      ? "text-[22px]"
      : size === "emphasized"
        ? "text-[18px]"
        : size === "compact"
          ? "text-[14px]"
          : "text-[16px]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={[
          nameOxanium.className,
          textSize,
          "font-bold italic tracking-tight text-white",
        ].join(" ")}
      >
        KAMIYA
      </span>
      {badge}
    </div>
  );
}

function RankingListSample({ kind }: { kind: BadgeKind }) {
  const metricTag = cyberMetricTag("totalScore", "ja");
  return (
    <div className="-mx-1">
      {MOCK_ROWS.map((row) => (
        <CyberRankingListRow
          key={`${kind}-${row.rank}`}
          rank={row.rank}
          displayName={row.displayName}
          photoURL={row.photoURL}
          metric="totalScore"
          metricTag={metricTag}
          posts={row.posts}
          countryCode={row.countryCode}
          language="ja"
          showFirstPlaceFrame
          nameExtra={
            row.isPro ? (
              kind === "current" ? (
                <ProCyberBadge
                  {...proBadgeStaticMotion}
                  compact
                  ariaLabel="UNITERZ Pro"
                />
              ) : (
                <ProCyberBadgeLegacy
                  {...proBadgeLegacyStaticMotion}
                  compact
                  ariaLabel="UNITERZ Pro"
                />
              )
            ) : null
          }
          scoreSlot={
            <CyberRankingScore
              rank={row.rank}
              metric="totalScore"
              counted={row.points}
            />
          }
        />
      ))}
    </div>
  );
}

export default function ProBadgeComparePreviewPage() {
  return (
    <main className="min-h-screen bg-[#03070b] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[720px]">
        <p className={labelClass(true)}>Dev preview</p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold text-white",
          ].join(" ")}
        >
          Pro badge compare
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/45">
          左（または上）が{" "}
          <span className="font-semibold text-white/70">今</span>
          （UNITERZ PRO タグ画像）、右（または下）が{" "}
          <span className="font-semibold text-white/70">前</span>
          （ダイヤモンド + PRO 文字）。ランキングリストの載り方も並べて確認できます。
        </p>
        <p className="mt-1 font-mono text-[11px] text-cyan-300/60">
          /dev/pro-badge-compare · /mobile/pro-badge-compare
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Panel title="Now — large" hint="UniterzProBadge gold mask">
            <div className="flex justify-center py-6">
              <UniterzProBadge height={72} tone="gold" />
            </div>
          </Panel>
          <Panel title="Previous — large" hint="Diamond mark + PRO word">
            <div className="flex justify-center py-6 scale-[2.2] origin-center">
              <ProCyberBadgeLegacy
                {...proBadgeLegacyStaticMotion}
                premium
                ariaLabel="UNITERZ Pro"
              />
            </div>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Panel title="Now — on name">
            <div className="space-y-4">
              <div>
                <p className={`${labelClass()} mb-2`}>premium（プロフィール）</p>
                <NameWithBadge kind="current" size="premium" />
              </div>
              <div>
                <p className={`${labelClass()} mb-2`}>emphasized（マイランク）</p>
                <NameWithBadge kind="current" size="emphasized" />
              </div>
              <div>
                <p className={`${labelClass()} mb-2`}>compact（リスト）</p>
                <NameWithBadge kind="current" size="compact" />
              </div>
            </div>
          </Panel>
          <Panel title="Previous — on name">
            <div className="space-y-4">
              <div>
                <p className={`${labelClass()} mb-2`}>premium（プロフィール）</p>
                <NameWithBadge kind="legacy" size="premium" />
              </div>
              <div>
                <p className={`${labelClass()} mb-2`}>emphasized（マイランク）</p>
                <NameWithBadge kind="legacy" size="emphasized" />
              </div>
              <div>
                <p className={`${labelClass()} mb-2`}>compact（リスト）</p>
                <NameWithBadge kind="legacy" size="compact" />
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel
            title="Now — ranking list"
            hint="本番と同じ CyberRankingListRow + ProCyberBadge compact"
          >
            <RankingListSample kind="current" />
          </Panel>
          <Panel
            title="Previous — ranking list"
            hint="同じリスト行に旧バッジを載せた場合"
          >
            <RankingListSample kind="legacy" />
          </Panel>
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-white/30">
          旧バッジは{" "}
          <code className="text-white/50">ProCyberBadgeLegacy</code>{" "}
          （比較専用）。本番は{" "}
          <code className="text-white/50">ProCyberBadge</code> →{" "}
          <code className="text-white/50">UniterzProBadge</code>。
        </p>
      </div>
    </main>
  );
}
