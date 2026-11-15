import { getFirestore, Timestamp } from "firebase-admin/firestore";

/** tip の T-60 / T-45 / T-30 / T-15（cron は 5 分毎、±2.5 分）— lib と同値 */
const PREGAME_TARGETS_MS = [
  60 * 60 * 1000,
  45 * 60 * 1000,
  30 * 60 * 1000,
  15 * 60 * 1000,
] as const;
const PREGAME_TOLERANCE_MS = 150 * 1000;
const PREGAME_LOOKAHEAD_MS = PREGAME_TARGETS_MS[0] + PREGAME_TOLERANCE_MS;
const HOURLY_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const HOURLY_LOOKBACK_MS = 3 * 60 * 60 * 1000;

function tipInPregameWindow(tipAtMs: number, nowMs: number): boolean {
  if (!Number.isFinite(tipAtMs) || tipAtMs <= nowMs) return false;
  const delta = tipAtMs - nowMs;
  return PREGAME_TARGETS_MS.some(
    (target) => Math.abs(delta - target) <= PREGAME_TOLERANCE_MS
  );
}

function jstDayBoundsMs(now: Date): { startMs: number; endMs: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  // JST 0:00 = UTC 前日 15:00
  const startMs = Date.parse(`${y}-${m}-${d}T00:00:00+09:00`);
  return { startMs, endMs: startMs + 24 * 60 * 60 * 1000 };
}

/**
 * injury ingest を Vercel に投げる前のゲート（Firestore のみ）。
 * skip になるだけの時間帯は Next を起こさない。
 */
export async function shouldRunNbaInjuryIngest(
  trigger: "baseline" | "hourly" | "pregame",
  now = new Date(),
  baselineSlot?: "16" | "23"
): Promise<boolean> {
  const db = getFirestore();
  const nowMs = now.getTime();

  if (trigger === "baseline") {
    if (baselineSlot === "16") {
      const { startMs, endMs } = jstDayBoundsMs(now);
      const snap = await db
        .collection("games")
        .where("league", "==", "nba")
        .where("startAtJst", ">=", Timestamp.fromMillis(startMs))
        .where("startAtJst", "<", Timestamp.fromMillis(endMs))
        .limit(1)
        .select("status")
        .get();
      return !snap.empty;
    }
    // 23:00 — これから 18h 以内に tip がある試合向け
    const snap = await db
      .collection("games")
      .where("league", "==", "nba")
      .where("startAtJst", ">=", Timestamp.fromMillis(nowMs))
      .where(
        "startAtJst",
        "<=",
        Timestamp.fromMillis(nowMs + 18 * 60 * 60 * 1000)
      )
      .limit(1)
      .select("status")
      .get();
    return !snap.empty;
  }

  if (trigger === "hourly") {
    const snap = await db
      .collection("games")
      .where("league", "==", "nba")
      .where("startAtJst", ">=", Timestamp.fromMillis(nowMs - HOURLY_LOOKBACK_MS))
      .where("startAtJst", "<=", Timestamp.fromMillis(nowMs + HOURLY_LOOKAHEAD_MS))
      .limit(1)
      .select("status")
      .get();
    return !snap.empty;
  }

  // pregame
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", Timestamp.fromMillis(nowMs))
    .where(
      "startAtJst",
      "<=",
      Timestamp.fromMillis(nowMs + PREGAME_LOOKAHEAD_MS)
    )
    .limit(40)
    .select("status", "final", "startAtJst")
    .get();

  if (snap.empty) return false;

  return snap.docs.some((doc) => {
    const data = doc.data() ?? {};
    const status = String(data.status ?? "").toLowerCase();
    if (status === "final" || status === "ended" || data.final === true) {
      return false;
    }
    const tip = data.startAtJst;
    const tipMs =
      tip && typeof tip.toMillis === "function"
        ? tip.toMillis()
        : typeof tip === "number"
          ? tip
          : null;
    if (tipMs == null) return false;
    return tipInPregameWindow(tipMs, nowMs);
  });
}
