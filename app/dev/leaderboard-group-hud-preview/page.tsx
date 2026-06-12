"use client";

/**
 * /dev/leaderboard-group-hud-preview
 * リーダーボード > グループ — ターミナル HUD 案（本番未接続）
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import { IBM_Plex_Mono } from "next/font/google";
import type { GroupMemberPreview } from "@/lib/communities/memberPreviews";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const BG = "#05080f";
const CYAN = "#22d3ee";
const MAGENTA = "#e879f9";

type MockGroup = {
  id: string;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  memberCount: number;
  competitionLine: string;
  role: "owner" | "member";
  memberPreviews: GroupMemberPreview[];
  archived?: boolean;
};

const MOCK_MEMBERS = {
  a: [
    { uid: "u1", photoURL: "https://i.pravatar.cc/96?img=12", role: "owner" as const },
    { uid: "u2", photoURL: "https://i.pravatar.cc/96?img=32", role: "member" as const },
    { uid: "u3", photoURL: "https://i.pravatar.cc/96?img=45", role: "member" as const },
    { uid: "u4", photoURL: null, role: "member" as const },
  ],
  b: [
    { uid: "u5", photoURL: "https://i.pravatar.cc/96?img=8", role: "owner" as const },
    { uid: "u6", photoURL: "https://i.pravatar.cc/96?img=15", role: "member" as const },
    { uid: "u7", photoURL: "https://i.pravatar.cc/96?img=22", role: "member" as const },
  ],
  c: [
    { uid: "u8", photoURL: "https://i.pravatar.cc/96?img=3", role: "owner" as const },
    { uid: "u9", photoURL: null, role: "member" as const },
  ],
  d: [] as GroupMemberPreview[],
  e: [
    { uid: "u10", photoURL: "https://i.pravatar.cc/96?img=51", role: "owner" as const },
    { uid: "u11", photoURL: "https://i.pravatar.cc/96?img=52", role: "member" as const },
    { uid: "u12", photoURL: "https://i.pravatar.cc/96?img=53", role: "member" as const },
    { uid: "u13", photoURL: "https://i.pravatar.cc/96?img=54", role: "member" as const },
  ],
  f: [
    { uid: "u14", photoURL: "https://i.pravatar.cc/96?img=60", role: "owner" as const },
    { uid: "u15", photoURL: "https://i.pravatar.cc/96?img=61", role: "member" as const },
    { uid: "u16", photoURL: "https://i.pravatar.cc/96?img=62", role: "member" as const },
    { uid: "u17", photoURL: "https://i.pravatar.cc/96?img=63", role: "member" as const },
  ],
};

const MOCK_GROUPS: MockGroup[] = [
  {
    id: "1",
    name: "NBA予想サークル",
    description: "プレーオフ期間の仲間内バトル",
    headerImageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=240&h=240&fit=crop",
    memberCount: 12,
    competitionLine: "NBA · 総得点",
    role: "owner",
    memberPreviews: MOCK_MEMBERS.a,
  },
  {
    id: "2",
    name: "WC予想部隊",
    description: "ワールドカップ予選突破を目指す",
    headerImageUrl:
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a9?w=240&h=240&fit=crop",
    memberCount: 8,
    competitionLine: "WC · 勝率",
    role: "owner",
    memberPreviews: MOCK_MEMBERS.b,
  },
  {
    id: "3",
    name: "深夜の精度厨",
    description: "マージン精度だけを信じる少数精鋭",
    headerImageUrl: null,
    memberCount: 5,
    competitionLine: "NBA · スコア精度",
    role: "member",
    memberPreviews: MOCK_MEMBERS.c,
  },
  {
    id: "4",
    name: "旧シーズン部",
    description: "シーズン終了 — 閲覧のみ",
    headerImageUrl: null,
    memberCount: 0,
    competitionLine: "NBA · 総得点",
    role: "member",
    memberPreviews: MOCK_MEMBERS.d,
    archived: true,
  },
  {
    id: "5",
    name: "Jリーグ予想会",
    description: "週末の試合を中心にスコア予想を共有",
    headerImageUrl:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=240&h=240&fit=crop",
    memberCount: 14,
    competitionLine: "J1 · アップセット",
    role: "member",
    memberPreviews: MOCK_MEMBERS.e,
  },
  {
    id: "6",
    name: "プロ連合β",
    description: "PRO メンバー限定のランキング",
    headerImageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=240&h=240&fit=crop",
    memberCount: 18,
    competitionLine: "WC · 連勝",
    role: "member",
    memberPreviews: MOCK_MEMBERS.f,
  },
];

const NOTCH_CLIP =
  "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)";

function GridBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.28]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
      }}
      aria-hidden
    />
  );
}

function GroupThumbnail({
  headerImageUrl,
  sizeClass,
  iconClass,
}: {
  headerImageUrl: string | null;
  sizeClass: string;
  iconClass: string;
}) {
  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden border",
        sizeClass,
      ].join(" ")}
      style={{ borderColor: "rgba(34,211,238,0.25)", background: "#0a1018" }}
    >
      {headerImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={headerImageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={["text-cyan-300/25", iconClass].join(" ")}>▣</span>
      )}
    </div>
  );
}

/** 本番 CommunityMemberAvatarStack の四角サイバー版 */
function HudMemberAvatarStack({
  previews,
  max = 4,
  sizeClassName = "size-6",
}: {
  previews: GroupMemberPreview[];
  max?: number;
  sizeClassName?: string;
}) {
  const shown = previews.slice(0, max);
  if (shown.length === 0) return null;

  return (
    <div
      className="inline-flex items-center rounded-sm border border-cyan-400/20 bg-[#0a1018]/80 px-1.5 py-1"
      aria-hidden
    >
      {shown.map((m, i) => {
        const ring =
          m.role === "owner"
            ? "ring-cyan-400/70"
            : "ring-emerald-400/55";
        return (
          <div
            key={m.uid}
            className={[
              "relative shrink-0 overflow-hidden rounded-sm bg-[#1a2430] ring-1",
              sizeClassName,
              ring,
              i > 0 ? "-ml-1.5" : "",
            ].join(" ")}
            style={{ zIndex: shown.length - i }}
          >
            {m.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.photoURL}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[8px] font-semibold text-white/35">
                ?
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoleBadge({ role }: { role: "owner" | "member" }) {
  const isOwner = role === "owner";
  return (
    <span
      className="shrink-0 border px-1.5 py-px text-[9px] font-medium tracking-widest sm:text-[10px]"
      style={
        isOwner
          ? {
              borderColor: "rgba(251,191,36,0.45)",
              color: "rgba(251,191,36,0.9)",
              background: "rgba(251,191,36,0.08)",
            }
          : {
              borderColor: "rgba(34,211,238,0.3)",
              color: "rgba(186,230,253,0.75)",
              background: "rgba(34,211,238,0.06)",
            }
      }
    >
      {isOwner ? "OWNER" : "MEMBER"}
    </span>
  );
}

function GroupMetaRow({
  memberCount,
  memberPreviews,
  stackSize,
}: {
  memberCount: number;
  memberPreviews: GroupMemberPreview[];
  stackSize: string;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-medium tabular-nums text-cyan-200/75 sm:text-xs">
        {memberCount}人
      </span>
      <HudMemberAvatarStack
        previews={memberPreviews}
        sizeClassName={stackSize}
      />
    </div>
  );
}

function HudGroupCardMobile({ group }: { group: MockGroup }) {
  const accentColor = group.archived ? MAGENTA : CYAN;

  return (
    <button
      type="button"
      className="group relative flex w-full overflow-hidden text-left transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.995]"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <span
        className="w-[3px] shrink-0"
        style={{
          background: accentColor,
          boxShadow: `0 0 14px ${accentColor}55`,
        }}
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 items-stretch gap-3 px-3 py-3">
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <RoleBadge role={group.role} />
          <GroupThumbnail
            headerImageUrl={group.headerImageUrl}
            sizeClass="size-[3.25rem]"
            iconClass="text-base"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[15px] font-semibold text-cyan-50/95"
            style={{ textShadow: `0 0 14px ${CYAN}22` }}
          >
            {group.name}
          </p>
          {group.description ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-white/45">
              {group.description}
            </p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-[11px] text-white/40">
            {group.competitionLine}
          </p>
          <GroupMetaRow
            memberCount={group.memberCount}
            memberPreviews={group.memberPreviews}
            stackSize="size-5"
          />
        </div>
      </div>
    </button>
  );
}

function HudGroupCardWeb({ group }: { group: MockGroup }) {
  return (
    <button
      type="button"
      className="group relative w-full text-left transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.995]"
      style={{
        clipPath: NOTCH_CLIP,
        background:
          "linear-gradient(145deg, rgba(34,211,238,0.04) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.2) 100%)",
        border: `1px solid ${group.archived ? "rgba(232,121,249,0.18)" : "rgba(34,211,238,0.12)"}`,
      }}
    >
      <div className="px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4 sm:pt-3.5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <RoleBadge role={group.role} />
          {group.archived ? (
            <span className="text-[10px] tracking-[0.14em] text-fuchsia-300/55">
              終了
            </span>
          ) : null}
        </div>

        <div className="flex gap-3 sm:gap-3.5">
          <GroupThumbnail
            headerImageUrl={group.headerImageUrl}
            sizeClass="size-[4.5rem] sm:size-28"
            iconClass="text-3xl"
          />

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-cyan-50/95 sm:text-[15px]"
              style={{ textShadow: `0 0 16px ${CYAN}28` }}
            >
              {group.name}
            </p>
            {group.description ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/45 sm:text-xs">
                {group.description}
              </p>
            ) : null}
            <p className="mt-1.5 text-[11px] text-cyan-200/50 sm:text-xs">
              {group.competitionLine}
            </p>
            <GroupMetaRow
              memberCount={group.memberCount}
              memberPreviews={group.memberPreviews}
              stackSize="size-8"
            />
          </div>
        </div>
      </div>
    </button>
  );
}

function HudEmptySlot({
  label,
  tone,
  webGrid = false,
}: {
  label: string;
  tone: "cyan" | "amber";
  webGrid?: boolean;
}) {
  const color = tone === "cyan" ? CYAN : "#fbbf24";
  return (
    <button
      type="button"
      className={[
        "flex w-full items-center justify-center gap-2 border border-dashed transition-colors hover:bg-white/3",
        webGrid ? "min-h-[148px]" : "px-4 py-8",
      ].join(" ")}
      style={{
        borderColor: `${color}44`,
        clipPath: webGrid ? NOTCH_CLIP : undefined,
      }}
    >
      <Plus className="size-4" style={{ color: `${color}aa` }} aria-hidden />
      <span
        className="text-xs tracking-[0.18em] sm:text-sm"
        style={{ color: `${color}cc` }}
      >
        {label}
      </span>
    </button>
  );
}

function HudSection({
  title,
  suffix,
  children,
  gridCols,
}: {
  title: string;
  suffix: string;
  children: React.ReactNode;
  gridCols?: 1 | 2;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-xs tracking-[0.22em] text-cyan-300/70 sm:text-sm">
          {title}
        </p>
        <p className="text-[10px] tracking-[0.16em] text-white/30 sm:text-[11px]">
          {suffix}
        </p>
      </div>
      <div
        className={
          gridCols === 2
            ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
            : "space-y-2"
        }
      >
        {children}
      </div>
    </section>
  );
}

function PreviewPanel({ variant }: { variant: "mobile" | "web" }) {
  const owned = MOCK_GROUPS.filter((g) => g.role === "owner");
  const member = MOCK_GROUPS.filter((g) => g.role === "member");
  const isWeb = variant === "web";
  const Card = isWeb ? HudGroupCardWeb : HudGroupCardMobile;

  return (
    <div
      className={[
        "relative overflow-hidden border border-white/10",
        isWeb ? "min-h-[720px]" : "min-h-[600px]",
      ].join(" ")}
      style={{ background: BG }}
    >
      <GridBackdrop />
      <div
        className={[
          "relative z-10",
          isWeb ? "px-6 py-6 sm:px-8" : "px-3 py-4",
        ].join(" ")}
      >
        <div className="mb-5 border-b border-white/8 pb-4">
          <h2
            className={[
              "font-semibold tracking-[0.08em] text-cyan-100",
              isWeb ? "text-lg" : "text-base",
            ].join(" ")}
          >
            マイグループ
          </h2>
        </div>

        <div className={isWeb ? "space-y-8" : "space-y-6"}>
          <HudSection
            title=">> 作成スロット"
            suffix="2/3"
            gridCols={isWeb ? 2 : 1}
          >
            {owned.map((g) => (
              <Card key={g.id} group={g} />
            ))}
            <HudEmptySlot label="グループを作成" tone="cyan" webGrid={isWeb} />
          </HudSection>

          <HudSection
            title=">> 参加スロット"
            suffix="4/5"
            gridCols={isWeb ? 2 : 1}
          >
            {member.map((g) => (
              <Card key={g.id} group={g} />
            ))}
            <HudEmptySlot label="コードで参加" tone="amber" webGrid={isWeb} />
          </HudSection>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardGroupHudPreviewPage() {
  const [focus, setFocus] = useState<"mobile" | "web" | "both">("both");

  return (
    <div
      className={`min-h-dvh text-white ${mono.className}`}
      style={{ background: "#020304" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <p className="text-[11px] tracking-[0.22em] text-cyan-400/70">
            DEV PREVIEW · 本番未接続
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-[0.08em] text-white sm:text-2xl">
            リーダーボード / グループ — HUD リスト案
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
            装飾ラベルは除き、本番と同じグループ名・競技条件・メンバー数 +
            重なりアバター（四角）を表示しています。
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["both", "両方"],
                ["mobile", "モバイル"],
                ["web", "Web"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFocus(key)}
                className={[
                  "border px-3 py-1.5 text-xs tracking-[0.14em] transition-colors",
                  focus === key
                    ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-100"
                    : "border-white/15 text-white/45 hover:border-white/25",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div
          className={[
            "grid gap-6",
            focus === "both" ? "lg:grid-cols-2" : "grid-cols-1",
          ].join(" ")}
        >
          {(focus === "both" || focus === "mobile") && (
            <div>
              <p className="mb-2 text-[11px] tracking-[0.18em] text-white/40">
                MOBILE (~390px)
              </p>
              <div className="mx-auto max-w-[390px]">
                <PreviewPanel variant="mobile" />
              </div>
            </div>
          )}
          {(focus === "both" || focus === "web") && (
            <div>
              <p className="mb-2 text-[11px] tracking-[0.18em] text-white/40">
                WEB — 2カラムグリッド
              </p>
              <PreviewPanel variant="web" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
