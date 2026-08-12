/**
 * 既存ユーザーの user_career を cumulative_stats + users から埋める。
 * 週/月ピーク・Top10・GB・lifetime units はオプションで追加スキャン。
 *
 * 使い方（リポジトリルート）:
 *   # .env.local の FIREBASE_* か service-account.json
 *   npx tsx scripts/backfill-user-career.ts --dry-run --limit=20
 *   npx tsx scripts/backfill-user-career.ts --from=2026-04 --with-periods --with-units --with-group-battles
 */

// @ts-ignore
import adminPkg from "firebase-admin";
import fs from "fs";
import path from "path";
import { buildUserCareerFromSources } from "../lib/profile/buildUserCareerFromSources";
import {
  applyGroupBattleRankToCareer,
  applyPeriodRankToCareer,
} from "../lib/profile/buildUserCareerFromSources";
import {
  parseUserCareerDoc,
  USER_CAREER_COLLECTION,
  type UserCareerDoc,
} from "../lib/profile/userCareer";
import { parseUserReportDocId } from "../lib/reports/parseUserReportDocId";
import { parseCareerPeriodRankFromBadgeIdFiltered } from "../lib/profile/parseCareerPeriodRankFromBadge";
import { nbaSeasonKeyFromDateJST } from "../lib/rankings/nbaSeason";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const WITH_PERIODS = process.argv.includes("--with-periods");
const WITH_UNITS = process.argv.includes("--with-units");
const WITH_GB = process.argv.includes("--with-group-battles");
const SKIP_USER_REPORTS = process.argv.includes("--skip-user-reports");
/** posts から最高連勝を復元（デフォルト ON。切るなら --skip-streaks） */
const WITH_STREAKS = !process.argv.includes("--skip-streaks");
/** rankingByPhase からプレーイン/PO 順位を再計算して monthly に載せる（デフォルト ON） */
const WITH_PHASE_RANKS = !process.argv.includes("--skip-phase-ranks");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const fromArg = process.argv.find((a) => a.startsWith("--from="));
/** 履歴の下限（例: 2026-04）。未指定で --with-periods なら 2026-04 */
const FROM_LABEL =
  fromArg?.split("=")[1]?.trim() ||
  (WITH_PERIODS || WITH_GB ? "2026-04" : "");
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const ONLY_UID = uidArg?.split("=")[1]?.trim() || "";

function loadDotEnvLocal(): void {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function normalizePrivateKey(raw: string): string {
  return raw.trim().replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
}

function initAdmin(): void {
  loadDotEnvLocal();
  const saPath = path.resolve(process.cwd(), "service-account.json");
  if (fs.existsSync(saPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(
    process.env.FIREBASE_PRIVATE_KEY ?? ""
  );
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing credentials: service-account.json or FIREBASE_* in .env.local"
    );
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

initAdmin();
const db = admin.firestore();

/** label が FROM_LABEL 以降か（monthly: YYYY-MM / weekly: YYYY-MM-DD） */
function isOnOrAfterFrom(label: string): boolean {
  if (!FROM_LABEL) return true;
  const from = FROM_LABEL.trim();
  if (!from) return true;
  // monthly from "2026-04" — compare YYYY-MM prefix
  if (/^\d{4}-\d{2}$/.test(from)) {
    if (/^\d{4}-\d{2}$/.test(label)) return label >= from;
    if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label.slice(0, 7) >= from;
    return label >= from;
  }
  // dateKey from
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    if (/^\d{4}-\d{2}$/.test(label)) return `${label}-01` >= from;
    return label >= from;
  }
  return label >= from;
}

/** プレーオフ暦（4–6月）なら playoffs 章へ、それ以外は regular */
function boardForPeriodLabel(
  period: "weekly" | "monthly",
  label: string
): "regular" | "playoffs" {
  let month = 0;
  if (period === "monthly") {
    month = Number(label.split("-")[1] ?? 0);
  } else {
    month = Number(label.split("-")[1] ?? 0);
  }
  if (month >= 4 && month <= 6) return "playoffs";
  return "regular";
}

function seasonKeyFromPeriodLabel(
  period: "weekly" | "monthly",
  label: string
): string {
  if (period === "monthly") {
    const [y, m] = label.split("-").map(Number);
    if (Number.isFinite(y) && Number.isFinite(m)) {
      return nbaSeasonKeyFromDateJST(new Date(Date.UTC(y, m - 1, 15)));
    }
  }
  const [y, m, d] = label.split("-").map(Number);
  if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
    return nbaSeasonKeyFromDateJST(new Date(Date.UTC(y, m - 1, d)));
  }
  return nbaSeasonKeyFromDateJST(new Date());
}

async function sumLifetimeUnits(uid: string): Promise<number | null> {
  if (!WITH_UNITS) return null;
  const snap = await db
    .collection("unit_ledger")
    .where("uid", "==", uid)
    .get();
  let sum = 0;
  for (const doc of snap.docs) {
    const amount = Number(doc.data()?.amount ?? 0);
    if (Number.isFinite(amount) && amount > 0) sum += Math.floor(amount);
  }
  return sum;
}

type PeriodEntry = {
  period: "weekly" | "monthly";
  label: string;
  ranks: Map<string, number>;
};

async function loadPeriodEntries(): Promise<PeriodEntry[]> {
  if (!WITH_PERIODS) return [];
  const snap = await db.collection("period_ranking_snapshots").get();
  const out: PeriodEntry[] = [];
  let skippedBefore = 0;
  for (const doc of snap.docs) {
    const id = doc.id;
    const m = /^nba_(weekly|monthly)_(.+)_totalPoints$/.exec(id);
    if (!m) continue;
    const period = m[1] as "weekly" | "monthly";
    const label = m[2]!;
    if (!isOnOrAfterFrom(label)) {
      skippedBefore += 1;
      continue;
    }
    const data = doc.data() as {
      ranks?: Record<string, number>;
      rows?: Array<{ uid?: string; rank?: number }>;
    };
    const ranks = new Map<string, number>();
    if (data.ranks && typeof data.ranks === "object") {
      for (const [uid, rank] of Object.entries(data.ranks)) {
        const r = Number(rank);
        if (uid && Number.isFinite(r) && r >= 1) ranks.set(uid, Math.floor(r));
      }
    } else if (Array.isArray(data.rows)) {
      for (const row of data.rows) {
        const uid = typeof row.uid === "string" ? row.uid : "";
        const r = Number(row.rank);
        if (uid && Number.isFinite(r) && r >= 1) ranks.set(uid, Math.floor(r));
      }
    }
    if (ranks.size > 0) out.push({ period, label, ranks });
  }
  console.log(
    `[periods] loaded=${out.length} skippedBeforeFrom=${skippedBefore} from=${FROM_LABEL || "(all)"}`
  );
  return out;
}

function mergePeriodEntries(a: PeriodEntry[], b: PeriodEntry[]): PeriodEntry[] {
  const map = new Map<string, PeriodEntry>();
  for (const entry of [...a, ...b]) {
    const key = `${entry.period}:${entry.label}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        period: entry.period,
        label: entry.label,
        ranks: new Map(entry.ranks),
      });
      continue;
    }
    for (const [uid, rank] of entry.ranks) {
      const existing = prev.ranks.get(uid);
      if (existing == null || rank < existing) {
        prev.ranks.set(uid, rank);
      }
    }
  }
  return [...map.values()];
}

/** Pro 週次/月次レポートに保存された totalPoints 順位（プレーイン/PO 期間を含む） */
async function loadUserReportPeriodEntries(): Promise<PeriodEntry[]> {
  if (SKIP_USER_REPORTS) return [];
  const snap = await db.collection("user_reports").get();
  const map = new Map<string, PeriodEntry>();
  let skippedBefore = 0;
  let skippedStatus = 0;
  for (const doc of snap.docs) {
    const parsed = parseUserReportDocId(doc.id);
    if (!parsed) continue;
    if (!isOnOrAfterFrom(parsed.label)) {
      skippedBefore += 1;
      continue;
    }
    const data = doc.data() as {
      league?: string;
      rank?: unknown;
      status?: string;
    };
    if (data.league !== "nba") continue;
    if (
      parsed.period === "weekly" &&
      data.status != null &&
      data.status !== "final"
    ) {
      skippedStatus += 1;
      continue;
    }
    const rank = Number(data.rank);
    if (!Number.isFinite(rank) || rank < 1) continue;
    const key = `${parsed.period}:${parsed.label}`;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        period: parsed.period,
        label: parsed.label,
        ranks: new Map(),
      };
      map.set(key, entry);
    }
    entry.ranks.set(parsed.uid, Math.floor(rank));
  }
  const out = [...map.values()].filter((e) => e.ranks.size > 0);
  console.log(
    `[user-reports] loaded=${out.length} docs=${snap.size} skippedBeforeFrom=${skippedBefore} skippedWeeklyNonFinal=${skippedStatus} from=${FROM_LABEL || "(all)"}`
  );
  return out;
}

/** 週/月ランキング Unit 付与時に残る totalPoints 順位 */
async function loadUnitLedgerPeriodEntries(): Promise<PeriodEntry[]> {
  const map = new Map<string, PeriodEntry>();
  let skippedBefore = 0;
  let skippedMetric = 0;
  for (const reason of ["weekly_rank", "monthly_rank"] as const) {
    const period = reason === "weekly_rank" ? "weekly" : "monthly";
    const snap = await db
      .collection("unit_ledger")
      .where("reason", "==", reason)
      .get();
    for (const doc of snap.docs) {
      const d = doc.data() as {
        uid?: string;
        label?: string;
        rank?: unknown;
        metric?: string;
      };
      const metric = String(d.metric ?? "totalPoints");
      if (metric !== "totalPoints") {
        skippedMetric += 1;
        continue;
      }
      const uid = String(d.uid ?? "").trim();
      const label = String(d.label ?? "").trim();
      const rank = Number(d.rank);
      if (!uid || !label || !Number.isFinite(rank) || rank < 1) continue;
      if (!isOnOrAfterFrom(label)) {
        skippedBefore += 1;
        continue;
      }
      const key = `${period}:${label}`;
      let entry = map.get(key);
      if (!entry) {
        entry = { period, label, ranks: new Map() };
        map.set(key, entry);
      }
      const prev = entry.ranks.get(uid);
      if (prev == null || rank < prev) {
        entry.ranks.set(uid, Math.floor(rank));
      }
    }
  }
  const out = [...map.values()].filter((e) => e.ranks.size > 0);
  console.log(
    `[unit-ledger] loaded=${out.length} skippedBeforeFrom=${skippedBefore} skippedNonTotalPoints=${skippedMetric} from=${FROM_LABEL || "(all)"}`
  );
  return out;
}

/** competition rank: 同点は同じ順位、次はスキップしない（dense）ではなく 1 + #{strictly better} */
function assignCompetitionRanks(
  scored: Array<{ uid: string; points: number }>
): Map<string, number> {
  const sorted = [...scored].sort((a, b) => b.points - a.points);
  const out = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]!.points < sorted[i - 1]!.points) {
      rank = i + 1;
    }
    out.set(sorted[i]!.uid, rank);
  }
  return out;
}

/**
 * cumulative_stats.rankingByPhase.{play_in|playoffs} から全ユーザー順位を再計算。
 * 旧月次/期間スナップが消えても、CAREER の Best Monthly / Monthly Top10 用に使える。
 */
async function loadPlayoffPhasePeriodEntries(): Promise<PeriodEntry[]> {
  if (!WITH_PHASE_RANKS) return [];
  const snap = await db.collection("cumulative_stats").get();
  const playIn: Array<{ uid: string; points: number }> = [];
  const playoffs: Array<{ uid: string; points: number }> = [];
  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const phase = (data.rankingByPhase ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const pi = phase.play_in;
    const po = phase.playoffs;
    const piPosts = Number(pi?.totalPosts ?? pi?.posts ?? 0);
    const poPosts = Number(po?.totalPosts ?? po?.posts ?? 0);
    const piPts = Number(pi?.totalPoints ?? 0);
    const poPts = Number(po?.totalPoints ?? 0);
    if (Number.isFinite(piPosts) && piPosts > 0 && Number.isFinite(piPts)) {
      playIn.push({ uid: doc.id, points: piPts });
    }
    if (Number.isFinite(poPosts) && poPosts > 0 && Number.isFinite(poPts)) {
      playoffs.push({ uid: doc.id, points: poPts });
    }
  }
  const out: PeriodEntry[] = [];
  if (playIn.length > 0) {
    out.push({
      period: "monthly",
      label: "2026-playin",
      ranks: assignCompetitionRanks(playIn),
    });
  }
  if (playoffs.length > 0) {
    out.push({
      period: "monthly",
      label: "2026-playoffs",
      ranks: assignCompetitionRanks(playoffs),
    });
  }

  // アーカイブは play_in / playoffs 全体のみ（ラウンド Top20 は Best Monthly に混ぜない）
  const archiveIds = [
    { id: "play_in_totalPoints", label: "2026-playin" },
    { id: "playoffs_totalPoints", label: "2026-playoffs" },
  ] as const;
  const archiveEntries: PeriodEntry[] = [];
  for (const row of archiveIds) {
    const doc = await db
      .collection("cumulative_ranking_snapshots_archive")
      .doc("2025-26-playoffs")
      .collection("docs")
      .doc(row.id)
      .get();
    if (!doc.exists) continue;
    const data = doc.data() as {
      ranks?: Record<string, number>;
      rows?: Array<{ uid?: string; rank?: number }>;
    };
    const ranks = new Map<string, number>();
    if (data.ranks && typeof data.ranks === "object") {
      for (const [uid, rank] of Object.entries(data.ranks)) {
        const r = Number(rank);
        if (uid && Number.isFinite(r) && r >= 1) ranks.set(uid, Math.floor(r));
      }
    }
    for (const r of data.rows ?? []) {
      const uid = typeof r.uid === "string" ? r.uid : "";
      const rank = Number(r.rank);
      if (!uid || !Number.isFinite(rank) || rank < 1) continue;
      const prev = ranks.get(uid);
      if (prev == null || rank < prev) ranks.set(uid, Math.floor(rank));
    }
    if (ranks.size > 0) {
      archiveEntries.push({
        period: "monthly",
        label: row.label,
        ranks,
      });
    }
  }

  const merged = mergePeriodEntries(out, archiveEntries);
  console.log(
    `[phase-ranks] playIn=${playIn.length} playoffs=${playoffs.length} archivePeriods=${archiveEntries.length} merged=${merged.length}`
  );
  return merged;
}

/** NBA 確定 posts から CAREER 用サマリーを復元（WC は除外） */
async function statsFromPosts(uid: string): Promise<{
  predictions: number;
  hits: number;
  winRatePct: number;
  maxWinStreak: number | null;
  exactHits: number;
} | null> {
  if (!WITH_STREAKS) return null;
  const snap = await db
    .collection("posts")
    .where("authorUid", "==", uid)
    .get()
    .catch(() => null);
  if (!snap || snap.empty) return null;
  const rows = snap.docs
    .map((d) => {
      const x = d.data() as Record<string, unknown>;
      const league = String(x.league ?? "").toLowerCase();
      // CAREER は NBA のみ。WC 等は一切含めない
      if (league && league !== "nba") return null;
      const stats = (x.stats ?? {}) as Record<string, unknown>;
      if (stats.isWin !== true && stats.isWin !== false) return null;
      const isWin = stats.isWin === true;
      const scoreError =
        typeof stats.scoreError === "number" && Number.isFinite(stats.scoreError)
          ? stats.scoreError
          : null;
      // NBA 完全的中: 勝ちかつ scoreError===0（または予測スコア＝結果）
      const exactHit =
        isWin &&
        (scoreError === 0 ||
          (() => {
            const pred = (
              x.prediction as
                | { score?: { home?: number; away?: number } }
                | undefined
            )?.score;
            const result = x.result as
              | { home?: number; away?: number }
              | undefined;
            return (
              typeof pred?.home === "number" &&
              typeof pred?.away === "number" &&
              typeof result?.home === "number" &&
              typeof result?.away === "number" &&
              pred.home === result.home &&
              pred.away === result.away
            );
          })());
      const settled = x.settledAt as
        | { toMillis?: () => number; seconds?: number }
        | undefined;
      let ms = 0;
      if (settled && typeof settled.toMillis === "function") ms = settled.toMillis();
      else if (settled && typeof settled.seconds === "number") {
        ms = settled.seconds * 1000;
      }
      if (ms <= 0) return null;
      return { ms, isWin, exactHit };
    })
    .filter(
      (r): r is { ms: number; isWin: boolean; exactHit: boolean } => r != null
    )
    .sort((a, b) => a.ms - b.ms);

  let cur = 0;
  let peak = 0;
  let exactHits = 0;
  let hits = 0;
  for (const r of rows) {
    if (r.exactHit) exactHits += 1;
    if (r.isWin) {
      hits += 1;
      cur += 1;
      peak = Math.max(peak, cur);
    } else {
      cur = 0;
    }
  }
  const predictions = rows.length;
  const winRatePct =
    predictions > 0 ? Math.round((hits / predictions) * 1000) / 10 : 0;
  return {
    predictions,
    hits,
    winRatePct,
    maxWinStreak: peak >= 1 ? peak : null,
    exactHits,
  };
}

type GbEntry = {
  battleId: string;
  period: "weekly" | "monthly";
  label: string;
  memberRanks: Map<string, number>;
};

async function loadGroupBattleEntries(): Promise<GbEntry[]> {
  if (!WITH_GB) return [];
  const snap = await db
    .collection("group_battle_period_snapshots")
    .where("status", "==", "final")
    .get();
  const out: GbEntry[] = [];
  let skippedBefore = 0;
  for (const doc of snap.docs) {
    const d = doc.data() as {
      battleId?: string;
      period?: string;
      label?: string;
      rows?: Array<{
        rank?: number;
        memberScores?: Array<{ uid?: string }>;
      }>;
    };
    const battleId = String(d.battleId ?? "");
    const period = d.period === "monthly" ? "monthly" : "weekly";
    const label = String(d.label ?? "");
    if (!battleId || !label) continue;
    if (!isOnOrAfterFrom(label)) {
      skippedBefore += 1;
      continue;
    }
    const memberRanks = new Map<string, number>();
    for (const row of d.rows ?? []) {
      const rank = Number(row.rank);
      if (!Number.isFinite(rank) || rank < 1) continue;
      for (const m of row.memberScores ?? []) {
        const uid = typeof m.uid === "string" ? m.uid : "";
        if (!uid) continue;
        const prev = memberRanks.get(uid);
        if (prev == null || rank < prev) memberRanks.set(uid, Math.floor(rank));
      }
    }
    if (memberRanks.size > 0) {
      out.push({ battleId, period, label, memberRanks });
    }
  }
  console.log(
    `[group-battles] loaded=${out.length} skippedBeforeFrom=${skippedBefore} from=${FROM_LABEL || "(all)"}`
  );
  return out;
}

async function main() {
  console.log(
    `[career] dryRun=${DRY_RUN} from=${FROM_LABEL || "(all)"} periods=${WITH_PERIODS} units=${WITH_UNITS} gb=${WITH_GB} streaks=${WITH_STREAKS} phaseRanks=${WITH_PHASE_RANKS}`
  );

  const [
    periodEntries,
    reportPeriodEntries,
    ledgerPeriodEntries,
    phasePeriodEntries,
    gbEntries,
  ] = await Promise.all([
    loadPeriodEntries(),
    loadUserReportPeriodEntries(),
    loadUnitLedgerPeriodEntries(),
    loadPlayoffPhasePeriodEntries(),
    loadGroupBattleEntries(),
  ]);
  const allPeriodEntries = mergePeriodEntries(
    mergePeriodEntries(
      mergePeriodEntries(periodEntries, reportPeriodEntries),
      ledgerPeriodEntries
    ),
    phasePeriodEntries
  );
  console.log(
    `[career] periodSources snapshots=${periodEntries.length} userReports=${reportPeriodEntries.length} unitLedger=${ledgerPeriodEntries.length} phase=${phasePeriodEntries.length} merged=${allPeriodEntries.length}`
  );

  let cumDocs: Array<FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot> =
    [];
  if (ONLY_UID) {
    const one = await db.collection("cumulative_stats").doc(ONLY_UID).get();
    if (one.exists) cumDocs = [one];
  } else {
    const cumSnap = await db.collection("cumulative_stats").select().get();
    cumDocs = cumSnap.docs;
  }
  console.log(
    `[career] candidates=${cumDocs.length}${ONLY_UID ? ` uid=${ONLY_UID}` : ""}`
  );

  let done = 0;
  let written = 0;
  for (const doc of cumDocs) {
    if (done >= LIMIT) break;
    const uid = doc.id;
    done += 1;

    const [cumFull, userSnap, existingSnap, lifetime, badgesSnap] =
      await Promise.all([
      db.collection("cumulative_stats").doc(uid).get(),
      db.collection("users").doc(uid).get(),
      db.collection(USER_CAREER_COLLECTION).doc(uid).get(),
      sumLifetimeUnits(uid),
      db.collection("user_badges").doc(uid).collection("badges").get(),
    ]);

    let career: UserCareerDoc = buildUserCareerFromSources({
      uid,
      cumulative: cumFull.exists
        ? (cumFull.data() as Record<string, unknown>)
        : null,
      user: userSnap.exists
        ? (userSnap.data() as Record<string, unknown>)
        : null,
      existing: existingSnap.exists
        ? parseUserCareerDoc(uid, existingSnap.data())
        : null,
      lifetimeUnitsEarned: lifetime,
      source: "backfill",
    });

    // 週/月ピークはソースから再適用（古い null / ラウンド順位を残さない）
    const clearedSeasons: typeof career.seasons = {};
    for (const [sk, chapter] of Object.entries(career.seasons)) {
      clearedSeasons[sk] = {
        regular: {
          ...chapter.regular,
          bestWeeklyRank: null,
          bestMonthlyRank: null,
          weeklyTop10Count: 0,
          monthlyTop10Count: 0,
        },
        playoffs: {
          ...chapter.playoffs,
          bestWeeklyRank: null,
          bestMonthlyRank: null,
          weeklyTop10Count: 0,
          monthlyTop10Count: 0,
        },
      };
    }
    career = {
      ...career,
      summary: {
        ...career.summary,
        bestWeeklyRank: null,
        bestMonthlyRank: null,
        weeklyTop10Count: 0,
        monthlyTop10Count: 0,
      },
      seasons: clearedSeasons,
      periodSeen: {},
    };

    const fromPosts = await statsFromPosts(uid);
    if (fromPosts) {
      const prevStreak = career.summary.maxWinStreak;
      const nextStreak =
        fromPosts.maxWinStreak == null
          ? prevStreak
          : prevStreak == null || fromPosts.maxWinStreak > prevStreak
            ? fromPosts.maxWinStreak
            : prevStreak;
      career = {
        ...career,
        summary: {
          ...career.summary,
          // posts の NBA 集計を正とする（WC 投稿は含めない）
          predictions: fromPosts.predictions,
          hits: fromPosts.hits,
          winRatePct: fromPosts.winRatePct,
          maxWinStreak: nextStreak,
          exactHits: fromPosts.exactHits,
        },
      };
    }

    for (const entry of allPeriodEntries) {
      const rank = entry.ranks.get(uid);
      if (rank == null) continue;
      const isPlayoffLabel =
        entry.label === "2026-playin" || entry.label === "2026-playoffs";
      career = applyPeriodRankToCareer(career, {
        period: entry.period,
        label: entry.label,
        rank,
        seasonKey: isPlayoffLabel
          ? "2025-26"
          : seasonKeyFromPeriodLabel(entry.period, entry.label),
        board: isPlayoffLabel
          ? "playoffs"
          : boardForPeriodLabel(entry.period, entry.label),
      });
    }

    for (const badgeDoc of badgesSnap.docs) {
      const parsed = parseCareerPeriodRankFromBadgeIdFiltered(badgeDoc.id);
      if (!parsed) continue;
      const label = parsed.label;
      const isPlayInOrPlayoffsAll =
        label.includes("playin") || /^20\d{2}-playoffs$/.test(label);
      const isCalendarPeriod =
        /^\d{4}-\d{2}$/.test(label) || /^\d{4}-\d{2}-\d{2}$/.test(label);
      // ラウンド別バッジ（po-r1 等）は Best Monthly に使わない
      if (!isPlayInOrPlayoffsAll && !isCalendarPeriod) continue;
      if (isCalendarPeriod && !isOnOrAfterFrom(label)) continue;
      career = applyPeriodRankToCareer(career, {
        period: parsed.period,
        label,
        rank: parsed.rank,
        seasonKey: isPlayInOrPlayoffsAll
          ? "2025-26"
          : seasonKeyFromPeriodLabel(parsed.period, label),
        board: isPlayInOrPlayoffsAll
          ? "playoffs"
          : boardForPeriodLabel(parsed.period, label),
      });
    }

    for (const entry of gbEntries) {
      const rank = entry.memberRanks.get(uid);
      if (rank == null) continue;
      career = applyGroupBattleRankToCareer(career, {
        battleId: entry.battleId,
        period: entry.period,
        label: entry.label,
        rank,
      });
    }

    if (DRY_RUN) {
      if (done <= 5 || done % 100 === 0) {
        console.log(
          `[dry] ${uid} posts=${career.summary.predictions} streak=${career.summary.maxWinStreak} skins=${career.summary.unlockedSkinCount} bestW=${career.summary.bestWeeklyRank} bestM=${career.summary.bestMonthlyRank} wTop10=${career.summary.weeklyTop10Count} mTop10=${career.summary.monthlyTop10Count} gb=${career.summary.bestGroupBattleRank} seasons=${Object.keys(career.seasons).join(",")}`
        );
      }
      continue;
    }

    await db.collection(USER_CAREER_COLLECTION).doc(uid).set(career);
    written += 1;
    if (written % 50 === 0) {
      console.log(`[career] written=${written}/${done}`);
    }
  }

  console.log(`[career] done scanned=${done} written=${written}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
