import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldPath } from "firebase-admin/firestore";
import { db } from "../firebase";
import { sendExpoPushToUids, type SendTarget } from "./sendExpoPush";
import type { DisciplinePushInput } from "./pushNotificationCopy";

/** 過去季の取り直し（ingest --force / 初回 backfill）で一斉配信しない */
const MAX_GAME_AGE_DAYS = 3;
/** NBA Rule 12A: レギュラー 16 回目、プレーオフ 7 回目で 1 試合停止。以降 2 回ごと */
const TECH_SUSPENSION_FIRST = { regular: 16, playoffs: 7 } as const;
const LIVE_ALERTS = "nbaDisciplineLiveAlerts";

type Phase = keyof typeof TECH_SUSPENSION_FIRST;
type Kind = "tech" | "flag" | "eject";
type GameEvent = { p?: unknown; k?: unknown };

function isSuspensionCount(n: number, phase: Phase): boolean {
  const first = TECH_SUSPENSION_FIRST[phase];
  return n >= first && (n - first) % 2 === 0;
}

function suspensionState(
  seasonTech: number,
  gameTech: number,
  phase: Phase
): DisciplinePushInput["suspension"] {
  if (gameTech <= 0) return null;
  for (let n = seasonTech - gameTech + 1; n <= seasonTech; n++) {
    if (isSuspensionCount(n, phase)) return "reached";
  }
  return isSuspensionCount(seasonTech + 1, phase) ? "next" : null;
}

function gameAgeDays(date: string): number {
  const ms = Date.parse(`${date}T12:00:00Z`);
  return Number.isFinite(ms) ? (Date.now() - ms) / 86_400_000 : Infinity;
}

/** `nbaDiscipline/{season}` の今季テクニカル数（取り消し反映済み）と集計時刻 */
async function snapshotTech(
  seasonKey: string,
  playerId: string,
  phase: Phase
): Promise<{ tech: number; builtAtMs: number } | null> {
  if (!seasonKey) return null;
  const techPath = new FieldPath("players", playerId, phase, "tech");
  const [season] = await db.getAll(db.collection("nbaDiscipline").doc(seasonKey), {
    fieldMask: [techPath, "builtAtMs"],
  });
  if (!season?.exists) return null;
  return {
    tech: Number(season.get(techPath) ?? 0) || 0,
    builtAtMs: Number(season.get("builtAtMs") ?? 0) || 0,
  };
}

async function sendToFans(
  playerId: string,
  discipline: DisciplinePushInput,
  logTag: string
): Promise<void> {
  const fans = await db
    .collection("users")
    .where("favoriteNbaPlayerIds", "array-contains", playerId)
    .select()
    .get();
  if (fans.empty) return;
  const targets: SendTarget[] = fans.docs.map((d) => ({
    uid: d.id,
    data: { type: "discipline_alert", playerId },
  }));
  const result = await sendExpoPushToUids({
    type: "discipline_alert",
    targets,
    matchup: { discipline },
  });
  console.log(`${logTag} player=${playerId} sent=${result.sent} fans=${targets.length}`);
}

/**
 * 試合中（ライブ ingest が毎分 `nbaDisciplineLiveAlerts` を作成）→ お気に入りにしているユーザーへ即時。
 * 今季テクニカル数 = 前日までの集計 + この試合の何本目か。
 */
export const onNbaDisciplineLiveAlertCreated = onDocumentCreated(
  { document: `${LIVE_ALERTS}/{alertId}`, region: "asia-northeast1" },
  async (event) => {
    const a = event.data?.data() as
      | {
          playerId?: string;
          playerName?: string;
          kind?: Kind;
          nth?: number;
          opponentAbbr?: string;
          period?: number | null;
          clock?: string | null;
          seasonKey?: string;
          seasonType?: string;
          date?: string;
        }
      | undefined;
    if (!a?.playerId || !a.kind) return;
    if (gameAgeDays(String(a.date ?? "")) > MAX_GAME_AGE_DAYS) return;
    const phase: Phase = a.seasonType === "playoffs" ? "playoffs" : "regular";

    let seasonTech: number | null = null;
    if (a.kind === "tech") {
      const snap = await snapshotTech(String(a.seasonKey ?? ""), a.playerId, phase);
      seasonTech = (snap?.tech ?? 0) + (a.nth ?? 1);
    }
    await sendToFans(
      a.playerId,
      {
        playerName: a.playerName || "NBA",
        tech: a.kind === "tech" ? 1 : 0,
        flag: a.kind === "flag" ? 1 : 0,
        eject: a.kind === "eject" ? 1 : 0,
        seasonTech,
        suspension: seasonTech != null ? suspensionState(seasonTech, 1, phase) : null,
        live: {
          opponentAbbr: a.opponentAbbr ?? "",
          period: a.period ?? null,
          clock: a.clock ?? null,
        },
      },
      `[onNbaDisciplineLiveAlertCreated] alert=${event.params.alertId}`
    );
  }
);

/**
 * 日次 ingest の `nbaGameDiscipline/{bdlGameId}` 作成 → 試合中に通知できなかった選手だけ（取りこぼし用）。
 */
export const onNbaGameDisciplineCreated = onDocumentCreated(
  { document: "nbaGameDiscipline/{gameId}", region: "asia-northeast1" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const doc = snap.data() as {
      seasonKey?: string;
      seasonType?: string;
      date?: string;
      events?: GameEvent[];
      names?: Record<string, string>;
      builtAtMs?: number;
    };
    const events = Array.isArray(doc.events) ? doc.events : [];
    if (events.length === 0) return;
    const date = String(doc.date ?? "");
    if (gameAgeDays(date) > MAX_GAME_AGE_DAYS) return;
    const seasonKey = String(doc.seasonKey ?? "");
    const phase: Phase = doc.seasonType === "playoffs" ? "playoffs" : "regular";

    const byPlayer = new Map<string, { tech: number; flag: number; eject: number }>();
    for (const ev of events) {
      const pid = typeof ev.p === "string" ? ev.p : "";
      const k = ev.k;
      if (!pid || (k !== "tech" && k !== "flag" && k !== "eject")) continue;
      const row = byPlayer.get(pid) ?? { tech: 0, flag: 0, eject: 0 };
      row[k] += 1;
      byPlayer.set(pid, row);
    }

    const liveAlerted = new Set(
      (
        await db
          .collection(LIVE_ALERTS)
          .where("gameId", "==", event.params.gameId)
          .select("playerId")
          .get()
      ).docs.map((d) => String(d.get("playerId") ?? ""))
    );

    for (const [playerId, counts] of byPlayer) {
      if (liveAlerted.has(playerId)) continue;
      let seasonTech: number | null = null;
      if (counts.tech > 0) {
        const s = await snapshotTech(seasonKey, playerId, phase);
        if (s) {
          const includesGame = s.builtAtMs >= Number(doc.builtAtMs ?? 0);
          seasonTech = includesGame ? s.tech : s.tech + counts.tech;
        }
      }
      await sendToFans(
        playerId,
        {
          playerName: doc.names?.[playerId] ?? "NBA",
          ...counts,
          seasonTech,
          suspension:
            seasonTech != null ? suspensionState(seasonTech, counts.tech, phase) : null,
        },
        `[onNbaGameDisciplineCreated] game=${event.params.gameId}`
      );
    }
  }
);
