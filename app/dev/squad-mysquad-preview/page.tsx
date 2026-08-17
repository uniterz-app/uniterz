"use client";

/**
 * /dev/squad-mysquad-preview
 * MY SQUAD カードの配置・デザイン比較。
 * 採用案が決まったら SquadBattlePage に反映して本ページは削除して良い。
 */

import { useMemo, type ReactNode } from "react";
import cn from "clsx";
import { Copy, Plus } from "lucide-react";
import { nameOxanium, nameBebas, jp } from "@/lib/fonts";
import CyberNumber from "@/app/component/ui/CyberNumber";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
import { cyberRankPalette } from "@/lib/rankings/cyberRankVisual";
import {
  getSquadBattleMock,
  squadMemberToProfile,
  squadRankDelta,
  type Squad,
  type SquadMember,
} from "@/lib/squads/squadBattleMock";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";
const chamferStyle = {
  clipPath: CYBER_CHAMFER_CLIP,
  WebkitClipPath: CYBER_CHAMFER_CLIP,
} as const;

const SEG = {
  border: "#00F5FF",
  glow: "rgba(0,245,255,0.65)",
  bg: "rgba(0,245,255,0.85)",
};

function scoreColor(rank: number) {
  if (rank <= 3) return cyberRankPalette(rank).accent;
  return "#00F5FF";
}

function barPct(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

function Avatar({
  member,
  px = 28,
}: {
  member: SquadMember;
  px?: number;
}) {
  if (member.empty) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full border border-dashed border-white/25 text-white/35"
        style={{ width: px, height: px }}
      >
        <Plus size={Math.round(px * 0.4)} strokeWidth={2.5} />
      </span>
    );
  }
  const initial = (member.displayName || "?").slice(0, 1).toUpperCase();
  return (
    <span
      className={cn(
        nameOxanium.className,
        "flex shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 font-bold text-cyan-100"
      )}
      style={{ width: px, height: px, fontSize: Math.round(px * 0.36) }}
    >
      {initial}
    </span>
  );
}

function Trend({ squad }: { squad: Squad }) {
  const delta = squadRankDelta(squad);
  if (delta === 0) {
    return (
      <span className={cn(nameOxanium.className, "text-[9px] font-bold text-white/35")}>
        −
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        nameOxanium.className,
        "text-[9px] font-bold",
        up ? "text-cyan-300" : "text-rose-400"
      )}
    >
      {up ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-visible">
      <div
        className="relative z-20 ml-3 inline-flex items-center gap-1.5 border border-cyan-300/55 bg-[#070d16] px-2 py-0.5"
        style={chamferStyle}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#00F5FF]" />
        <span
          className={cn(
            nameOxanium.className,
            "text-[9px] font-black uppercase tracking-[0.16em] text-cyan-50"
          )}
        >
          My squad
        </span>
      </div>
      <div
        className="relative -mt-2.5 overflow-hidden shadow-[0_0_28px_rgba(0,245,255,0.22)]"
        style={{
          border: "2px solid rgba(0,245,255,0.45)",
          background:
            "linear-gradient(168deg, rgba(8,22,28,0.98), rgba(4,10,14,1))",
          boxShadow:
            "0 0 24px rgba(0,245,255,0.22), inset 0 0 0 2px rgba(0,245,255,0.12)",
        }}
      >
        <div className="relative z-10 pt-1.5">{children}</div>
      </div>
    </div>
  );
}

function InviteChip({ code }: { code: string }) {
  return (
    <span
      className={cn(
        nameOxanium.className,
        "inline-flex max-w-full items-center gap-1.5 border border-cyan-400/35 bg-cyan-400/10 px-2 py-1 text-[11px] font-bold tracking-[0.1em] text-cyan-100"
      )}
      style={chamferStyle}
    >
      <span className="text-white/40">CODE</span>
      <span>{code}</span>
      <Copy size={12} strokeWidth={2.4} className="opacity-80" />
    </span>
  );
}

function MemberList({
  members,
  compact = false,
}: {
  members: SquadMember[];
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-2")}>
      {members.map((m) => {
        if (m.empty) {
          return (
            <div
              key={m.uid}
              className="flex items-center gap-3 border border-dashed border-white/15 bg-transparent px-3 py-2.5"
            >
              <Avatar member={m} />
              <div className="min-w-0 flex-1">
                <p className={cn(jp.className, "text-sm font-semibold text-white/45")}>
                  空き枠 · 募集中
                </p>
                <p
                  className={cn(
                    nameOxanium.className,
                    "text-[10px] font-bold uppercase tracking-[0.16em] text-white/25"
                  )}
                >
                  OPEN SLOT
                </p>
              </div>
            </div>
          );
        }
        const posts = squadMemberToProfile(m).totalPosts;
        return (
          <div
            key={m.uid}
            className={cn(
              "flex items-center gap-3 border-2 border-cyan-400/22 bg-[#0a0e14]/90 px-3",
              compact ? "py-2" : "py-2.5"
            )}
          >
            <Avatar member={m} />
            <p
              className={cn(
                jp.className,
                "min-w-0 flex-1 truncate text-sm font-semibold text-white/90"
              )}
            >
              {m.displayName}
            </p>
            <div className="flex shrink-0 items-baseline gap-2.5">
              <CyberNumber value={posts} size="sm" suffix="posts" color="#CBD5E1" />
              <CyberNumber value={m.points} size="sm" suffix="pts" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type CardProps = { squad: Squad; maxAvg: number; inviteCode: string | null };

/* ============ 案A: 現行（名前中央・ランク右上・AVG大） ============ */
function VariantA({ squad, maxAvg, inviteCode }: CardProps) {
  const color = scoreColor(squad.rank);
  return (
    <Shell>
      <div className="relative px-4 pb-3 pt-3">
        <div className="absolute right-3 top-2 z-[1] flex flex-col items-end">
          <p className={cn(nameOxanium.className, "text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-300/65")}>
            Rank
          </p>
          <p
            className={cn(nameBebas.className, "mt-0.5 text-[40px] leading-[0.95] tracking-wide")}
            style={{ color, textShadow: "0 0 14px rgba(0,245,255,0.5)" }}
          >
            {String(squad.rank).padStart(2, "0")}
          </p>
          <Trend squad={squad} />
        </div>
        <div className="flex flex-col items-center px-14 text-center">
          <h2 className={cn(nameOxanium.className, "truncate text-[26px] font-black uppercase text-white")}>
            {squad.name}
          </h2>
          {inviteCode ? <div className="mt-2"><InviteChip code={inviteCode} /></div> : null}
        </div>
        <div className="mt-3 border-2 border-cyan-400/20 bg-black/30 px-3 py-3" style={chamferStyle}>
          <p className={cn(nameOxanium.className, "text-[10px] font-bold uppercase tracking-[0.16em] text-white/35")}>
            AVG POINTS
          </p>
          <div className="mt-1">
            <CyberNumber value={squad.avgPoints} size="lg" color={color} />
          </div>
          <div className="mt-2.5">
            <CyberSlantedSegBar pct={barPct(squad.avgPoints, maxAvg)} segments={10} compact forceStatic maxWidthClass="max-w-full" accent={SEG} />
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="mb-2 flex items-center gap-2 border-b border-cyan-400/20 pb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <p className={cn(nameOxanium.className, "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/65")}>
            Members
          </p>
        </div>
        <MemberList members={squad.members} />
      </div>
    </Shell>
  );
}

/* ============ 案B: 名前左 + ランク右（ヘッダー横並び） ============ */
function VariantB({ squad, maxAvg, inviteCode }: CardProps) {
  const color = scoreColor(squad.rank);
  return (
    <Shell>
      <div className="px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className={cn(nameOxanium.className, "truncate text-[22px] font-black uppercase leading-tight text-white")}>
              {squad.name}
            </h2>
            {inviteCode ? <div className="mt-2"><InviteChip code={inviteCode} /></div> : null}
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <p className={cn(nameOxanium.className, "text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-300/65")}>
              Rank
            </p>
            <p
              className={cn(nameBebas.className, "text-[36px] leading-[0.95] tracking-wide")}
              style={{ color, textShadow: "0 0 12px rgba(0,245,255,0.45)" }}
            >
              {String(squad.rank).padStart(2, "0")}
            </p>
            <Trend squad={squad} />
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3 border border-cyan-400/20 bg-black/25 px-3 py-2.5">
          <div>
            <p className={cn(nameOxanium.className, "text-[9px] font-bold uppercase tracking-[0.16em] text-white/35")}>
              AVG
            </p>
            <CyberNumber value={squad.avgPoints} size="md" color={color} />
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <CyberSlantedSegBar pct={barPct(squad.avgPoints, maxAvg)} segments={10} compact forceStatic maxWidthClass="max-w-full" accent={SEG} />
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className={cn(nameOxanium.className, "mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/65")}>
          Members
        </p>
        <MemberList members={squad.members} compact />
      </div>
    </Shell>
  );
}

/* ============ 案C: HUD ストリップ（ランク | AVG | コード） ============ */
function VariantC({ squad, maxAvg, inviteCode }: CardProps) {
  const color = scoreColor(squad.rank);
  return (
    <Shell>
      <div className="px-4 pb-3 pt-3">
        <h2 className={cn(nameOxanium.className, "text-center text-[22px] font-black uppercase tracking-wide text-white")}>
          {squad.name}
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="border border-cyan-400/20 bg-black/30 px-2 py-2 text-center">
            <p className={cn(nameOxanium.className, "text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-300/65")}>
              Rank
            </p>
            <p
              className={cn(nameBebas.className, "text-[28px] leading-none tracking-wide")}
              style={{ color, textShadow: "0 0 10px rgba(0,245,255,0.4)" }}
            >
              {String(squad.rank).padStart(2, "0")}
            </p>
            <div className="mt-0.5 flex justify-center">
              <Trend squad={squad} />
            </div>
          </div>
          <div className="border border-cyan-400/20 bg-black/30 px-2 py-2 text-center">
            <p className={cn(nameOxanium.className, "text-[8px] font-bold uppercase tracking-[0.14em] text-white/35")}>
              Avg pts
            </p>
            <div className="mt-1 flex justify-center">
              <CyberNumber value={squad.avgPoints} size="md" color={color} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border border-cyan-400/20 bg-black/30 px-2 py-2">
            <p className={cn(nameOxanium.className, "text-[8px] font-bold uppercase tracking-[0.14em] text-white/35")}>
              Code
            </p>
            {inviteCode ? (
              <p className={cn(nameOxanium.className, "mt-1 text-[11px] font-bold tracking-wider text-cyan-100")}>
                {inviteCode}
              </p>
            ) : (
              <p className={cn(nameOxanium.className, "mt-1 text-[11px] font-bold text-white/30")}>—</p>
            )}
          </div>
        </div>
        <div className="mt-2.5">
          <CyberSlantedSegBar pct={barPct(squad.avgPoints, maxAvg)} segments={10} compact forceStatic maxWidthClass="max-w-full" accent={SEG} />
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className={cn(nameOxanium.className, "mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/65")}>
          Members
        </p>
        <MemberList members={squad.members} compact />
      </div>
    </Shell>
  );
}

/* ============ 案D: AVG を控えめ・メンバー主役 ============ */
function VariantD({ squad, maxAvg, inviteCode }: CardProps) {
  const color = scoreColor(squad.rank);
  return (
    <Shell>
      <div className="px-4 pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className={cn(nameOxanium.className, "truncate text-[20px] font-black uppercase text-white")}>
              {squad.name}
            </h2>
            {inviteCode ? <div className="mt-1.5"><InviteChip code={inviteCode} /></div> : null}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(nameOxanium.className, "text-[9px] font-bold uppercase text-cyan-300/65")}>
              #{String(squad.rank).padStart(2, "0")}
            </span>
            <CyberNumber value={squad.avgPoints} size="sm" suffix="avg" color={color} />
            <Trend squad={squad} />
          </div>
        </div>
        <div className="mt-2">
          <CyberSlantedSegBar pct={barPct(squad.avgPoints, maxAvg)} segments={10} compact forceStatic maxWidthClass="max-w-full" accent={SEG} />
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className={cn(nameOxanium.className, "mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/65")}>
          Members
        </p>
        <MemberList members={squad.members} />
      </div>
    </Shell>
  );
}

/* ============ 案E: ランク左レール + コンパクトAVG ============ */
function VariantE({ squad, maxAvg, inviteCode }: CardProps) {
  const color = scoreColor(squad.rank);
  return (
    <Shell>
      <div className="flex gap-0">
        <div className="flex w-14 shrink-0 flex-col items-center justify-start border-r border-cyan-400/20 bg-cyan-400/[0.04] px-1 py-4">
          <p className={cn(nameOxanium.className, "text-[8px] font-bold uppercase tracking-[0.12em] text-cyan-300/65")}>
            Rank
          </p>
          <p
            className={cn(nameBebas.className, "mt-1 text-[32px] leading-none tracking-wide")}
            style={{ color, textShadow: "0 0 12px rgba(0,245,255,0.45)" }}
          >
            {String(squad.rank).padStart(2, "0")}
          </p>
          <div className="mt-1">
            <Trend squad={squad} />
          </div>
        </div>
        <div className="min-w-0 flex-1 px-3 pb-3 pt-3">
          <h2 className={cn(nameOxanium.className, "truncate text-[20px] font-black uppercase text-white")}>
            {squad.name}
          </h2>
          {inviteCode ? <div className="mt-1.5"><InviteChip code={inviteCode} /></div> : null}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div>
              <p className={cn(nameOxanium.className, "text-[8px] font-bold uppercase tracking-[0.14em] text-white/35")}>
                Avg points
              </p>
              <CyberNumber value={squad.avgPoints} size="md" color={color} />
            </div>
          </div>
          <div className="mt-2">
            <CyberSlantedSegBar pct={barPct(squad.avgPoints, maxAvg)} segments={10} compact forceStatic maxWidthClass="max-w-full" accent={SEG} />
          </div>
        </div>
      </div>
      <div className="border-t border-cyan-400/15 px-4 py-3">
        <p className={cn(nameOxanium.className, "mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/65")}>
          Members
        </p>
        <MemberList members={squad.members} compact />
      </div>
    </Shell>
  );
}

const VARIANTS: {
  id: string;
  title: string;
  note: string;
  render: (p: CardProps) => ReactNode;
}[] = [
  {
    id: "a",
    title: "案A — 現行（名前中央・ランク右上）",
    note: "AVG が大きく主役。名前とランクが離れてややチグハグ",
    render: (p) => <VariantA {...p} />,
  },
  {
    id: "b",
    title: "案B — ヘッダー横並び",
    note: "名前左・ランク右。AVG は md サイズでバーと横並び",
    render: (p) => <VariantB {...p} />,
  },
  {
    id: "c",
    title: "案C — HUD 3分割",
    note: "Rank / Avg / Code を同じ重みのパネルに。バランス重視",
    render: (p) => <VariantC {...p} />,
  },
  {
    id: "d",
    title: "案D — メンバー主役",
    note: "AVG を小さくしてヘッダーに押し込み、メンバー一覧を広く",
    render: (p) => <VariantD {...p} />,
  },
  {
    id: "e",
    title: "案E — 左レール Rank",
    note: "ランクを縦レールに固定。名前〜AVG〜メンバーが自然に流れる",
    render: (p) => <VariantE {...p} />,
  },
];

export default function SquadMySquadPreviewPage() {
  const props = useMemo(() => {
    const mock = getSquadBattleMock("recruiting");
    const squad = mock.mySquad!;
    const maxAvg = Math.max(1, ...mock.leaderboard.map((s) => s.avgPoints));
    return {
      squad,
      maxAvg,
      inviteCode: squad.inviteCode ?? "NC-7K2M",
    } satisfies CardProps;
  }, []);

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-10">
        <div>
          <p
            className={cn(
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/65"
            )}
          >
            DEV PREVIEW
          </p>
          <h1
            className={cn(
              nameOxanium.className,
              "mt-1 text-xl font-black uppercase tracking-wide"
            )}
          >
            MY SQUAD カード案
          </h1>
          <p className="mt-1 text-xs text-white/45">
            募集中状態のモック。採用案が決まったら本体に反映します。
          </p>
        </div>

        {VARIANTS.map((v) => (
          <section key={v.id}>
            <h2 className={cn(nameOxanium.className, "text-sm font-bold text-cyan-100")}>
              {v.title}
            </h2>
            <p className="mb-2 mt-0.5 text-xs text-white/45">{v.note}</p>
            {v.render(props)}
          </section>
        ))}
      </div>
    </main>
  );
}
