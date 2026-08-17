/**
 * 月次レポートの獲得 Unit を unit_ledger から月単位で載せる。
 */
import type { Firestore } from "firebase-admin/firestore";
import type {
  MonthlyReportUnitGrant,
  MonthlyReportUnitMetric,
  MonthlyReportUnitSource,
} from "./monthlyReportTypes";

export type MonthlyUnitsBundle = {
  unitsEarned: number;
  breakdown: MonthlyReportUnitGrant[];
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function jstMonthRange(monthKey: string): { start: Date; endExclusive: Date } | null {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return null;
  return {
    start: new Date(Date.UTC(y, m - 1, 1, -9, 0, 0)),
    endExclusive: new Date(Date.UTC(y, m, 1, -9, 0, 0)),
  };
}

function dateKeyJstFromMs(ms: number): string {
  const j = new Date(ms + 9 * 60 * 60 * 1000);
  return `${j.getUTCFullYear()}-${pad2(j.getUTCMonth() + 1)}-${pad2(j.getUTCDate())}`;
}

function tsMillis(ts: unknown): number {
  if (!ts || typeof ts !== "object") return 0;
  const o = ts as { toMillis?: () => number; seconds?: number };
  if (typeof o.toMillis === "function") return o.toMillis();
  if (typeof o.seconds === "number") return o.seconds * 1000;
  return 0;
}

function mapSource(reason: string): MonthlyReportUnitSource {
  switch (reason) {
    case "weekly_rank":
      return "personal_weekly";
    case "monthly_rank":
      return "personal_monthly";
    case "group_battle_weekly":
      return "group_weekly";
    case "group_battle_monthly":
      return "group_monthly";
    case "referral_invitee":
    case "referral_referrer":
    case "referral_milestone":
      return "invite";
    default:
      return "event";
  }
}

function mapMetric(raw: unknown): MonthlyReportUnitMetric | null {
  if (raw === "totalPoints" || raw === "winRate") return raw;
  if (raw === "totalGoalScorerHits" || raw === "scorer") return "scorer";
  if (raw === "totalUpset" || raw === "upset") return "upset";
  return null;
}

function grantFromLedgerDoc(
  id: string,
  data: Record<string, unknown>,
  monthKey: string,
  ms: number
): MonthlyReportUnitGrant | null {
  const amount =
    typeof data.amount === "number" && Number.isFinite(data.amount)
      ? data.amount
      : 0;
  if (amount <= 0) return null;
  const reason = typeof data.reason === "string" ? data.reason : "unknown";
  const metric = mapMetric(data.metric);
  const source: MonthlyReportUnitSource =
    metric && (reason === "weekly_rank" || reason === "monthly_rank")
      ? "metric_rank"
      : mapSource(reason);
  const periodLabel =
    (typeof data.label === "string" && data.label) ||
    (typeof data.period === "string" && data.period) ||
    monthKey;
  const rank =
    typeof data.rank === "number" && Number.isFinite(data.rank)
      ? data.rank
      : null;
  return {
    id,
    source,
    amount,
    periodLabel,
    grantedDateKey: dateKeyJstFromMs(ms),
    rank,
    metric,
  };
}

/** monthKey（JST YYYY-MM）の付与を uid ごとにまとめる */
export async function loadMonthlyUnitsByUid(
  db: Firestore,
  monthKey: string
): Promise<Map<string, MonthlyUnitsBundle>> {
  const range = jstMonthRange(monthKey);
  const out = new Map<string, MonthlyUnitsBundle>();
  if (!range) return out;

  const snap = await db
    .collection("unit_ledger")
    .where("createdAt", ">=", range.start)
    .where("createdAt", "<", range.endExclusive)
    .get();

  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const uid = typeof data.uid === "string" ? data.uid : "";
    if (!uid) continue;
    const ms = tsMillis(data.createdAt);
    const grant = grantFromLedgerDoc(doc.id, data, monthKey, ms);
    if (!grant) continue;
    const cur = out.get(uid) ?? { unitsEarned: 0, breakdown: [] };
    cur.unitsEarned += grant.amount;
    cur.breakdown.push(grant);
    out.set(uid, cur);
  }

  for (const bundle of out.values()) {
    bundle.breakdown.sort((a, b) => b.amount - a.amount);
  }
  return out;
}

export function rankUnitsEarned(
  uids: string[],
  unitsByUid: Map<string, MonthlyUnitsBundle>
): Map<string, number> {
  const ranked = [...uids]
    .filter((uid) => (unitsByUid.get(uid)?.unitsEarned ?? 0) > 0)
    .sort(
      (a, b) =>
        (unitsByUid.get(b)?.unitsEarned ?? 0) -
        (unitsByUid.get(a)?.unitsEarned ?? 0)
    );
  return new Map(ranked.map((uid, i) => [uid, i + 1]));
}
