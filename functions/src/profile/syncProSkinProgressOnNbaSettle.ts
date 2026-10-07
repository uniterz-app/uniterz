/**
 * NBA settle 後に users.proSkinProgress を更新し、閾値マイルストーンを永続化。
 * cumulative_stats は読まない（薄いミラー集計）。
 *
 * Free 中も進捗は積む。解放は Pro のみ。
 * Pro 中に閾値を今回初めて跨いだ ID だけ proSkinUnlockNoticeIds へ（モーダル用）。
 * Free→Pro 遡及は ensurePersisted 側で unlocked のみ（notice なし）。
 * プレシーズンは finalizePost が呼ばないため進捗に積まれない。
 * 連続予想日数: 試合日（Eastern）単位。前回の予想日との間に試合日が無ければ連続（試合がない日は飛ばす）。
 * 最多得点者的中 / 番狂わせ的中: シーズン累計。訂正 settle では前回結果との差分だけ反映。
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  nbaSeasonKeyFromDateJST,
  normalizeNbaSeasonPhase,
  resolveNbaRankingBucketKeys,
} from "../rankings/nbaSeason";
import {
  PRO_SKIN_STREAK_RUN_LENGTHS,
  PRO_SKIN_STREAK_RUN_MILESTONES,
  PRO_SKIN_THRESHOLD_MILESTONES,
  PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
} from "./proSkinMilestoneCatalog";
import { countMilestoneUnlockedProSkins } from "./countMilestoneUnlockedProSkins";
import { dateKeyET } from "../rankings/nbaPeriod";

const OWNER_COUNTS_DOC = "meta/proSkinOwnerCounts";

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function parsePeriodWins(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== "string" || !k) continue;
    const n = safeInt(v);
    if (n > 0) out[k] = n;
  }
  return out;
}

function isProUser(user: Record<string, unknown>): boolean {
  if (user.plan !== "pro") return false;
  const until = user.proUntil as
    | { toMillis?: () => number; seconds?: number; _seconds?: number }
    | Date
    | number
    | string
    | null
    | undefined;
  if (until == null || until === "") return true;
  let ms = 0;
  if (until instanceof Date) ms = until.getTime();
  else if (typeof until === "number") ms = until < 1e12 ? until * 1000 : until;
  else if (typeof until === "string") {
    const parsed = Date.parse(until);
    ms = Number.isFinite(parsed) ? parsed : 0;
  } else if (typeof until.toMillis === "function") ms = until.toMillis();
  else if (typeof until.seconds === "number") ms = until.seconds * 1000;
  else if (typeof until._seconds === "number") ms = until._seconds * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return true;
  return ms > Date.now();
}

async function incrementHolderCounts(ids: readonly string[]): Promise<void> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return;
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  for (const id of unique) {
    updates[`counts.${id}`] = FieldValue.increment(1);
  }
  await getFirestore().doc(OWNER_COUNTS_DOC).set(updates, { merge: true });
}

const GAME_DAY_KEYS_TTL_MS = 10 * 60 * 1000;
const gameDayKeysCache = new Map<string, { atMs: number; keys: string[] }>();

/** `gameDayIndex/nba__{season}` の開始時刻 → Eastern の試合日キー（昇順・重複なし） */
async function loadNbaGameDayKeys(seasonKey: string): Promise<string[] | null> {
  const hit = gameDayKeysCache.get(seasonKey);
  if (hit && Date.now() - hit.atMs < GAME_DAY_KEYS_TTL_MS) return hit.keys;
  try {
    const snap = await getFirestore()
      .collection("gameDayIndex")
      .doc(`nba__${seasonKey}`)
      .get();
    const raw = snap.exists ? snap.get("startMs") : null;
    if (!Array.isArray(raw)) return null;
    const keys = [
      ...new Set(
        raw
          .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
          .map((ms) => dateKeyET(new Date(ms)))
      ),
    ].sort();
    gameDayKeysCache.set(seasonKey, { atMs: Date.now(), keys });
    return keys;
  } catch (err) {
    console.warn("[syncProSkinProgressOnNbaSettle] game day index failed", err);
    return null;
  }
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + days));
  return base.toISOString().slice(0, 10);
}

/** prev と day の間（両端除く）に試合日が無ければ連続 */
export function isConsecutivePredictDay(
  prevDayKey: string,
  dayKey: string,
  gameDayKeys: readonly string[] | null
): boolean {
  if (!gameDayKeys || gameDayKeys.length === 0) {
    return addDaysToDateKey(prevDayKey, 1) === dayKey;
  }
  return !gameDayKeys.some((k) => k > prevDayKey && k < dayKey);
}

export function nextPredictDayStreak(opts: {
  prevDayKey: string;
  prevStreak: number;
  dayKey: string;
  gameDayKeys: readonly string[] | null;
}): { streak: number; lastDayKey: string } {
  const { prevDayKey, prevStreak, dayKey, gameDayKeys } = opts;
  if (!prevDayKey || prevStreak <= 0) return { streak: 1, lastDayKey: dayKey };
  /** 同日 / 遅れて届いた過去日の settle は数え直さない */
  if (dayKey <= prevDayKey) {
    return { streak: prevStreak, lastDayKey: prevDayKey };
  }
  return {
    streak: isConsecutivePredictDay(prevDayKey, dayKey, gameDayKeys)
      ? prevStreak + 1
      : 1,
    lastDayKey: dayKey,
  };
}

type ThresholdKind = (typeof PRO_SKIN_THRESHOLD_MILESTONES)[number]["kind"];

/** 訂正 settle（同じ post の再確定）は前回結果との差分だけ反映 */
function nextHitCount(
  prev: number,
  isCorrection: boolean,
  lastHit: boolean,
  hit: boolean
): number {
  if (!isCorrection) return hit ? prev + 1 : prev;
  if (!lastHit && hit) return prev + 1;
  if (lastHit && !hit) return Math.max(0, prev - 1);
  return prev;
}

export async function syncProSkinProgressOnNbaSettle(opts: {
  uid: string;
  postId: string;
  startAt: FirebaseFirestore.Timestamp | Date | null | undefined;
  league: string | null | undefined;
  countsForRanking: boolean;
  seasonPhase: string | null | undefined;
  exactHit: boolean;
  scorerHit: boolean;
  upsetHit: boolean;
  activeWinStreak: number;
}): Promise<void> {
  const leagueKey = String(opts.league ?? "")
    .trim()
    .toLowerCase();
  if (leagueKey !== "nba") return;
  const seasonPhase = normalizeNbaSeasonPhase(opts.seasonPhase);
  const isPreseason = seasonPhase === "preseason";
  if (!opts.countsForRanking && !isPreseason) return;

  const startDate =
    opts.startAt && typeof (opts.startAt as { toDate?: () => Date }).toDate ===
      "function"
      ? (opts.startAt as FirebaseFirestore.Timestamp).toDate()
      : opts.startAt instanceof Date
        ? opts.startAt
        : new Date();

  const nbaSeasonKey = isPreseason
    ? nbaSeasonKeyFromDateJST(startDate)
    : resolveNbaRankingBucketKeys("nba", true, startDate, seasonPhase)
        .nbaSeasonKey;
  if (
    !nbaSeasonKey ||
    nbaSeasonKey < PRO_SKIN_UNLOCK_FROM_SEASON_KEY
  ) {
    return;
  }

  const predictDayKey = dateKeyET(startDate);
  const gameDayKeys = await loadNbaGameDayKeys(nbaSeasonKey);

  const db = getFirestore();
  const userRef = db.doc(`users/${opts.uid}`);
  let newlyUnlockedIds: string[] = [];
  let unlockedCount = 0;

  await db.runTransaction(async (tx) => {
    newlyUnlockedIds = [];
    unlockedCount = 0;
    const snap = await tx.get(userRef);
    const user = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
    const prevRaw = user.proSkinProgress as Record<string, unknown> | undefined;
    const prevSeason =
      typeof prevRaw?.seasonKey === "string" ? prevRaw.seasonKey : "";
    const lastPostId =
      typeof prevRaw?.lastPostId === "string" ? prevRaw.lastPostId : "";
    const lastExactHit = prevRaw?.lastExactHit === true;
    const lastScorerHit = prevRaw?.lastScorerHit === true;
    const lastUpsetHit = prevRaw?.lastUpsetHit === true;
    const sameSeason = prevSeason === nbaSeasonKey;
    const prevPeriodWins = sameSeason ? parsePeriodWins(prevRaw?.periodWins) : {};
    const prevStreakRuns = sameSeason ? parsePeriodWins(prevRaw?.streakRuns) : {};
    const prevActiveWinStreak = sameSeason
      ? safeInt(prevRaw?.lastActiveWinStreak)
      : 0;

    const isCorrection = lastPostId === opts.postId;
    if (
      isCorrection &&
      lastExactHit === opts.exactHit &&
      lastScorerHit === opts.scorerHit &&
      lastUpsetHit === opts.upsetHit
    ) {
      return;
    }

    const prevPosts = sameSeason ? safeInt(prevRaw?.posts) : 0;
    const prevExactHits = sameSeason ? safeInt(prevRaw?.exactHits) : 0;
    const prevScorerHits = sameSeason ? safeInt(prevRaw?.scorerHits) : 0;
    const prevUpsetHits = sameSeason ? safeInt(prevRaw?.upsetHits) : 0;
    const prevMaxWinStreak = sameSeason ? safeInt(prevRaw?.maxWinStreak) : 0;
    const prevMaxPredictDayStreak = sameSeason
      ? safeInt(prevRaw?.maxPredictDayStreak)
      : 0;
    const nextDay = nextPredictDayStreak({
      prevDayKey:
        sameSeason && typeof prevRaw?.lastPredictDayKey === "string"
          ? prevRaw.lastPredictDayKey
          : "",
      prevStreak: sameSeason ? safeInt(prevRaw?.predictDayStreak) : 0,
      dayKey: predictDayKey,
      gameDayKeys,
    });
    const maxPredictDayStreak = Math.max(
      prevMaxPredictDayStreak,
      nextDay.streak
    );

    const posts = isCorrection ? prevPosts : prevPosts + 1;
    const exactHits = nextHitCount(
      prevExactHits,
      isCorrection,
      lastExactHit,
      opts.exactHit
    );
    const scorerHits = nextHitCount(
      prevScorerHits,
      isCorrection,
      lastScorerHit,
      opts.scorerHit
    );
    const upsetHits = nextHitCount(
      prevUpsetHits,
      isCorrection,
      lastUpsetHit,
      opts.upsetHit
    );
    let maxWinStreak = prevMaxWinStreak;
    const streak = Math.max(0, Math.floor(opts.activeWinStreak || 0));
    if (streak > maxWinStreak) maxWinStreak = streak;

    /** 連勝が N を「今回跨いだ」ときだけ +1（訂正 settle では数えない） */
    const streakRuns: Record<string, number> = { ...prevStreakRuns };
    const activeWinStreak = isCorrection ? prevActiveWinStreak : streak;
    if (!isCorrection) {
      for (const len of PRO_SKIN_STREAK_RUN_LENGTHS) {
        if (prevActiveWinStreak < len && streak >= len) {
          const key = String(len);
          streakRuns[key] = (streakRuns[key] ?? 0) + 1;
        }
      }
    }

    const isPro = isProUser(user);
    const unlocked = new Set<string>(
      Array.isArray(user.proSkinUnlockedIds)
        ? user.proSkinUnlockedIds.filter((x): x is string => typeof x === "string")
        : []
    );
    const prevHeld = new Set<string>([
      ...unlocked,
      ...(Array.isArray(user.proSkinHeldIds)
        ? user.proSkinHeldIds.filter((x): x is string => typeof x === "string")
        : []),
    ]);

    /** Pro 中に閾値を「今回初めて」跨いだ ID のみモーダル対象 */
    const liveNoticeIds: string[] = [];

    if (isPro) {
      const prevValues: Record<ThresholdKind, number> = {
        streak: prevMaxWinStreak,
        posts: prevPosts,
        exactHits: prevExactHits,
        predictDays: prevMaxPredictDayStreak,
        scorerHits: prevScorerHits,
        upsetHits: prevUpsetHits,
      };
      const nowValues: Record<ThresholdKind, number> = {
        streak: maxWinStreak,
        posts,
        exactHits,
        predictDays: maxPredictDayStreak,
        scorerHits,
        upsetHits,
      };
      for (const row of PRO_SKIN_THRESHOLD_MILESTONES) {
        const prevValue = prevValues[row.kind];
        const nowValue = nowValues[row.kind];
        const prevOk = prevValue >= row.threshold;
        const nowOk = nowValue >= row.threshold;
        if (nowOk) {
          if (!prevHeld.has(row.id)) newlyUnlockedIds.push(row.id);
          unlocked.add(row.id);
          if (!prevOk) liveNoticeIds.push(row.id);
        }
      }
      for (const row of PRO_SKIN_STREAK_RUN_MILESTONES) {
        const key = String(row.streak);
        const prevOk = (prevStreakRuns[key] ?? 0) >= row.runs;
        const nowOk = (streakRuns[key] ?? 0) >= row.runs;
        if (nowOk) {
          if (!prevHeld.has(row.id)) newlyUnlockedIds.push(row.id);
          unlocked.add(row.id);
          if (!prevOk) liveNoticeIds.push(row.id);
        }
      }
    }

    const held = new Set<string>([...prevHeld, ...unlocked]);
    const patch: Record<string, unknown> = {
      proSkinProgress: {
        seasonKey: nbaSeasonKey,
        posts,
        exactHits,
        scorerHits,
        upsetHits,
        maxWinStreak,
        maxPredictDayStreak,
        predictDayStreak: nextDay.streak,
        lastPredictDayKey: nextDay.lastDayKey,
        streakRuns,
        lastActiveWinStreak: activeWinStreak,
        periodWins: prevPeriodWins,
        updatedAtMs: Date.now(),
        lastPostId: opts.postId,
        lastExactHit: opts.exactHit,
        lastScorerHit: opts.scorerHit,
        lastUpsetHit: opts.upsetHit,
      },
      proSkinUnlockedIds: [...unlocked],
      proSkinHeldIds: [...held],
      proSkinUnlockSeason: PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (liveNoticeIds.length > 0) {
      patch.proSkinUnlockNoticeIds = FieldValue.arrayUnion(...liveNoticeIds);
    }

    tx.set(userRef, patch, { merge: true });
    unlockedCount = countMilestoneUnlockedProSkins([...unlocked]);
  });

  if (newlyUnlockedIds.length > 0) {
    try {
      await incrementHolderCounts(newlyUnlockedIds);
    } catch (err) {
      console.warn("[syncProSkinProgressOnNbaSettle] holder count failed", err);
    }
  }

  if (unlockedCount > 0) {
    try {
      const { syncUserCareerUnlockedSkinCount } = await import(
        "./syncUserCareer"
      );
      await syncUserCareerUnlockedSkinCount(opts.uid, unlockedCount);
    } catch (err) {
      console.warn("[syncProSkinProgressOnNbaSettle] career skin sync failed", err);
    }
  }
}
