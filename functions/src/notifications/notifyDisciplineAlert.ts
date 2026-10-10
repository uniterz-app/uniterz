import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldPath } from "firebase-admin/firestore";
import { db } from "../firebase";
import { sendExpoPushToUids, type SendTarget } from "./sendExpoPush";
import type { DisciplinePushInput } from "./pushNotificationCopy";

/** 過去季の取り直し（ingest --force / 初回 backfill）で一斉配信しない */
const MAX_GAME_AGE_DAYS = 3;
/** NBA Rule 12A: レギュラー 16 回目、プレーオフ 7 回目で 1 試合停止。以降 2 回ごと */
const TECH_SUSPENSION_FIRST = { regular: 16, playoffs: 7 } as const;

type Phase = keyof typeof TECH_SUSPENSION_FIRST;

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

/**
 * `nbaGameDiscipline/{bdlGameId}` 作成（日次 ingest の新規終了試合）→
 * その試合でテクニカル / フレグラント / 退場があった選手をお気に入りにしているユーザーへ。
 * 今季テクニカル数は `nbaDiscipline/{season}`（取り消し反映済み）から。
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

    for (const [playerId, counts] of byPlayer) {
      const fans = await db
        .collection("users")
        .where("favoriteNbaPlayerIds", "array-contains", playerId)
        .select()
        .get();
      if (fans.empty) continue;

      let seasonTech: number | null = null;
      if (counts.tech > 0 && seasonKey) {
        const techPath = new FieldPath("players", playerId, phase, "tech");
        const [season] = await db.getAll(db.collection("nbaDiscipline").doc(seasonKey), {
          fieldMask: [techPath, "builtAtMs"],
        });
        if (season?.exists) {
          const snapTech = Number(season.get(techPath) ?? 0) || 0;
          const includesGame = Number(season.get("builtAtMs") ?? 0) >= Number(doc.builtAtMs ?? 0);
          seasonTech = includesGame ? snapTech : snapTech + counts.tech;
        }
      }

      const discipline: DisciplinePushInput = {
        playerName: doc.names?.[playerId] ?? "NBA",
        ...counts,
        seasonTech,
        suspension:
          seasonTech != null ? suspensionState(seasonTech, counts.tech, phase) : null,
      };
      const targets: SendTarget[] = fans.docs.map((d) => ({
        uid: d.id,
        data: { type: "discipline_alert", playerId },
      }));
      const result = await sendExpoPushToUids({
        type: "discipline_alert",
        targets,
        matchup: { discipline },
      });
      console.log(
        `[onNbaGameDisciplineCreated] game=${event.params.gameId} player=${playerId} sent=${result.sent} fans=${targets.length}`
      );
    }
  }
);
