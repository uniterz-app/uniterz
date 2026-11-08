/**
 * スクワッドバトルの全員共通部分（大会・募集中スクワッド・ランキング・その顔ぶれのプロフィール）。
 * 画面を開くたびに数百 doc 読むため、Next データキャッシュで共有する。
 * スクワッドを変える API は `revalidateGroupBattleSharedCache()` で即時に捨てる。
 */

import { revalidateTag, unstable_cache } from "next/cache";
import type { Firestore } from "firebase-admin/firestore";
import { GROUP_BATTLE_MAX_MEMBERS } from "@/lib/groupBattles/constants";
import {
  getBattle,
  getCurrentBattle,
  parseSnapshotDoc,
  parseSquadDoc,
  snapshotRef,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import {
  entryProfileOrFallback,
  loadGroupBattleEntryProfiles,
  type GroupBattleEntryProfile,
} from "@/lib/groupBattles/server/loadEntryProfiles";
import type { GroupBattlePeriod } from "@/lib/groupBattles/types";

const GROUP_BATTLE_SHARED_TAG = "group-battles-shared";
/** 外部（Functions の phase 進行・スナップショット）由来の変化はこの秒数で拾う */
const GROUP_BATTLE_SHARED_REVALIDATE_SEC = 60;

type Battle = NonNullable<Awaited<ReturnType<typeof getCurrentBattle>>>;

export type GroupBattleSharedView = {
  battle: Battle | null;
  period: GroupBattlePeriod;
  label: string;
  openSquads: Array<Record<string, unknown>>;
  rankings: {
    battleId: string;
    period: GroupBattlePeriod;
    label: string;
    snapshot: Record<string, unknown> | null;
  } | null;
  profiles: Record<string, GroupBattleEntryProfile>;
};

export type GroupBattleSharedViewOpts = {
  battleId?: string | null;
  period?: GroupBattlePeriod;
  label?: string | null;
  weekIndex?: number | null;
};

async function loadGroupBattleSharedViewUncached(
  db: Firestore,
  opts: GroupBattleSharedViewOpts
): Promise<GroupBattleSharedView> {
  const period: GroupBattlePeriod =
    opts.period === "monthly" ? "monthly" : "weekly";
  const battle = opts.battleId
    ? await getBattle(db, opts.battleId)
    : await getCurrentBattle(db);
  if (!battle) {
    return {
      battle: null,
      period,
      label: "",
      openSquads: [],
      rankings: null,
      profiles: {},
    };
  }

  let label = (opts.label ?? "").trim();
  if (!label && period === "weekly") {
    const idx = Math.floor(Number(opts.weekIndex ?? 0));
    if (idx >= 1) {
      label = battle.weeklyLabels[idx - 1] ?? "";
    }
  }
  if (!label) {
    label =
      period === "weekly"
        ? battle.weeklyLabels[battle.weeklyLabels.length - 1] ?? ""
        : battle.monthlyRange.label;
  }

  const [openSnap, snapshotSnap] = await Promise.all([
    squadsCol(db, battle.id)
      .where("status", "in", ["forming", "entered"])
      .limit(80)
      .get(),
    label
      ? snapshotRef(db, battle.id, period, label).get()
      : Promise.resolve(null),
  ]);

  const openParsed = openSnap.docs
    .map((d) => parseSquadDoc(d.id, d.data() as Record<string, unknown>))
    .filter((s) => s.memberCount < GROUP_BATTLE_MAX_MEMBERS);

  const snapshot =
    snapshotSnap && snapshotSnap.exists
      ? parseSnapshotDoc(
          snapshotSnap.id,
          snapshotSnap.data() as Record<string, unknown>
        )
      : null;

  const profileMap = await loadGroupBattleEntryProfiles(db, [
    ...openParsed.flatMap((s) => s.memberUids),
    ...(snapshot?.rows.flatMap((r) => r.memberScores.map((m) => m.uid)) ??
      []),
  ]);

  const openSquads = openParsed.map((s) => ({
    id: s.id,
    name: s.name,
    memberCount: s.memberCount,
    openSlots: GROUP_BATTLE_MAX_MEMBERS - s.memberCount,
    status: s.status,
    memberUids: s.memberUids,
    members: s.memberUids.map((memberUid, i) =>
      entryProfileOrFallback(memberUid, profileMap, i)
    ),
  }));

  let rankings: GroupBattleSharedView["rankings"] = null;
  if (label) {
    rankings = {
      battleId: battle.id,
      period,
      label,
      snapshot: snapshot
        ? {
            ...snapshot,
            rows: snapshot.rows.map((row) => ({
              ...row,
              memberScores: row.memberScores.map((m) => {
                const p = profileMap.get(m.uid);
                return {
                  ...m,
                  displayName: p?.displayName,
                  handle: p?.handle ?? null,
                  photoURL: p?.photoURL ?? null,
                  plan: p?.plan,
                  seasonPoints: p?.points,
                  winRate: p?.winRate,
                  activeWinStreak: p?.activeWinStreak,
                  totalPosts: p?.totalPosts,
                  thisWeekRank: p?.thisWeekRank ?? null,
                  lastWeekRank: p?.lastWeekRank ?? null,
                  lastMonthRank: p?.lastMonthRank ?? null,
                };
              }),
            })),
          }
        : null,
    };
  }

  return {
    battle,
    period,
    label,
    openSquads,
    rankings,
    profiles: Object.fromEntries(profileMap),
  };
}

export function loadGroupBattleSharedView(
  db: Firestore,
  opts: GroupBattleSharedViewOpts = {}
): Promise<GroupBattleSharedView> {
  const key = [
    "group-battles-shared",
    opts.battleId ?? "",
    opts.period === "monthly" ? "monthly" : "weekly",
    (opts.label ?? "").trim(),
    String(Math.floor(Number(opts.weekIndex ?? 0)) || ""),
  ];
  return unstable_cache(
    () => loadGroupBattleSharedViewUncached(db, opts),
    key,
    {
      revalidate: GROUP_BATTLE_SHARED_REVALIDATE_SEC,
      tags: [GROUP_BATTLE_SHARED_TAG],
    }
  )();
}

/** 共通部分にあるプロフィールは使い回し、足りない uid だけ読む */
export async function entryProfilesFromSharedView(
  db: Firestore,
  shared: GroupBattleSharedView,
  uids: string[]
): Promise<Map<string, GroupBattleEntryProfile>> {
  const out = new Map(Object.entries(shared.profiles));
  const missing = uids.filter((uid) => uid && !out.has(uid));
  if (missing.length > 0) {
    for (const [uid, p] of await loadGroupBattleEntryProfiles(db, missing)) {
      out.set(uid, p);
    }
  }
  return out;
}

/** スクワッドの作成・参加・脱退・解散・名前変更・ロックの後に呼ぶ */
export function revalidateGroupBattleSharedCache(): void {
  revalidateTag(GROUP_BATTLE_SHARED_TAG, { expire: 0 });
}
