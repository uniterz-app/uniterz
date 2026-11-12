import { createHash } from "crypto";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  sendExpoPushToUids,
  type SendTarget,
} from "./sendExpoPush";
import {
  resolveGameMatchupCopy,
  type PushNotificationType,
} from "./pushNotificationCopy";
import { loadGamePredictorUids } from "./gamePredictors";

const PUSH_LEAGUES = ["nba", "bj", "j1", "pl", "wc"] as const;
const LOOKAHEAD_MS = 12 * 60 * 60 * 1000;
const LOOKAHEAD_LIMIT = 80;

type PregameKind = "injury_status" | "pro_insight_update";

function fingerprint(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) {
    return null;
  }
  if (Array.isArray(value) && value.length === 0) return null;
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 32);
}

/**
 * 「結論／重要読み」だけ指紋化。
 * narrative があれば MATCHUP + INJURY IMPACT。無ければ proBrief の edges / players。
 * schedule・context・sampleNote・timestamp は無視（文言微修正で飛ばない）。
 */
function insightConclusionMaterial(gameData: Record<string, unknown>): unknown {
  const narrative = gameData.proInsightNarrative as
    | {
        sections?: Array<{
          kind?: string;
          items?: Array<{ body?: unknown; evidence?: unknown }>;
        }>;
      }
    | null
    | undefined;
  if (narrative && Array.isArray(narrative.sections)) {
    const sections = narrative.sections
      .filter(
        (s) => s?.kind === "MATCHUP" || s?.kind === "INJURY IMPACT"
      )
      .map((s) => ({
        kind: s.kind,
        items: (s.items ?? []).map((item) => ({
          body: item.body ?? null,
          evidence: item.evidence ?? null,
        })),
      }));
    if (sections.length > 0) return { narrative: sections };
  }

  const brief = gameData.proBrief as
    | {
        home?: { edges?: unknown; players?: unknown };
        away?: { edges?: unknown; players?: unknown };
      }
    | null
    | undefined;
  if (!brief || typeof brief !== "object") return null;
  const material = {
    homeEdges: brief.home?.edges ?? null,
    awayEdges: brief.away?.edges ?? null,
    homePlayers: brief.home?.players ?? null,
    awayPlayers: brief.away?.players ?? null,
  };
  if (
    material.homeEdges == null &&
    material.awayEdges == null &&
    material.homePlayers == null &&
    material.awayPlayers == null
  ) {
    return null;
  }
  return { brief: material };
}

/** 有利側の勝つ確率（%）がこれだけ動いたら知らせる */
const KIT_WIN_PCT_ALERT_DELTA = 10;

type KitAlertState = { fav: string; pct: number };

function kitAlertStateOf(kit: unknown): KitAlertState | null {
  if (!kit || typeof kit !== "object") return null;
  const { favoredTeamId, winPct } = kit as { favoredTeamId?: unknown; winPct?: unknown };
  if (typeof favoredTeamId !== "string" || !favoredTeamId || typeof winPct !== "number") {
    return null;
  }
  return { fav: favoredTeamId, pct: winPct };
}

/** 有利なチームが入れ替わったか、有利側の勝つ確率が KIT_WIN_PCT_ALERT_DELTA 以上動いた */
function isKitShiftBig(prev: KitAlertState, next: KitAlertState): boolean {
  if (prev.fav !== next.fav) return true;
  return Math.abs(next.pct - prev.pct) >= KIT_WIN_PCT_ALERT_DELTA;
}

function formatInjuryPushDetail(report: unknown): string | undefined {
  if (!report || typeof report !== "object") return undefined;
  const players = (report as { players?: unknown }).players;
  if (!Array.isArray(players) || players.length === 0) return undefined;
  const lines: string[] = [];
  for (const raw of players.slice(0, 2)) {
    if (!raw || typeof raw !== "object") continue;
    const name = String((raw as { name?: unknown }).name ?? "").trim();
    const status = String((raw as { status?: unknown }).status ?? "").trim();
    if (!name || !status) continue;
    lines.push(`${name}: ${status}`);
  }
  if (lines.length === 0) return undefined;
  const more = players.length > 2 ? " +more" : "";
  return `${lines.join(" · ")}${more}`;
}

function targetsFromPredictorUids(
  gameId: string,
  type: PushNotificationType,
  uids: unknown
): SendTarget[] {
  if (!Array.isArray(uids)) return [];
  const out: SendTarget[] = [];
  const seen = new Set<string>();
  for (const raw of uids) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const uid = raw.trim();
    if (seen.has(uid)) continue;
    seen.add(uid);
    out.push({ uid, data: { type, gameId, postId: "" } });
  }
  return out;
}

/**
 * 試合 doc の injuryReport の差分、PRO PICK の予想の材料の大きな変化があれば Pro 向けに送る。
 * 予想の材料（predictKit）がある試合は有利なチームと勝つ確率だけを見る。無い試合だけ旧来の
 * narrative の MATCHUP / INJURY IMPACT（または brief の edges・players）の指紋で判定。
 * 初回はベースラインだけ（一斉配信回避）。先発・digest は廃止。
 */
export async function runNotifyPregameAlertCron(): Promise<void> {
  const firestore = getFirestore();
  const now = Date.now();
  const until = new Date(now + LOOKAHEAD_MS);

  const leagueSnaps = await Promise.all(
    PUSH_LEAGUES.map((league) =>
      firestore
        .collection("games")
        .where("league", "==", league)
        .where("startAtJst", ">=", Timestamp.fromMillis(now))
        .where("startAtJst", "<=", Timestamp.fromDate(until))
        .limit(LOOKAHEAD_LIMIT)
        .get()
    )
  );
  const gameDocs = leagueSnaps.flatMap((snap) => snap.docs);

  for (const gameDoc of gameDocs) {
    const gameData = gameDoc.data();
    if (gameData.final === true) continue;

    const injuryFp = fingerprint(gameData.injuryReport ?? null);
    // Pro Insight は gameProInsights/{id}（移行前は games 上の旧フィールド）
    const insightDoc =
      (await firestore.collection("gameProInsights").doc(gameDoc.id).get()).data() ?? {};
    const insightFp = fingerprint(
      insightConclusionMaterial({
        proInsightNarrative:
          insightDoc.proInsightNarrative ?? gameData.proInsightNarrative,
        proBrief: insightDoc.proBrief ?? gameData.proBrief,
      })
    );

    const kitState = kitAlertStateOf(insightDoc.predictKit);

    const prev = (gameData.pushPregame as
      | {
          injuryFp?: string | null;
          insightFp?: string | null;
          kit?: KitAlertState | null;
        }
      | undefined) ?? {};

    const changed: PregameKind[] = [];
    const next = {
      injuryFp: prev.injuryFp ?? null,
      insightFp: prev.insightFp ?? null,
      kit: prev.kit ?? null,
    };

    if (injuryFp) {
      if (prev.injuryFp && prev.injuryFp !== injuryFp) {
        changed.push("injury_status");
      }
      next.injuryFp = injuryFp;
    } else {
      next.injuryFp = null;
    }
    if (kitState) {
      // 基準は最初に見た値か前回知らせた値。小さな動きが積み重なって閾値を超えたときも 1 回だけ知らせる
      if (!prev.kit) {
        next.kit = kitState;
      } else if (isKitShiftBig(prev.kit, kitState)) {
        changed.push("pro_insight_update");
        next.kit = kitState;
      }
    } else if (insightFp) {
      if (prev.insightFp && prev.insightFp !== insightFp) {
        changed.push("pro_insight_update");
      }
      next.insightFp = insightFp;
    } else {
      next.insightFp = null;
    }

    const fingerprintChanged =
      next.injuryFp !== (prev.injuryFp ?? null) ||
      next.insightFp !== (prev.insightFp ?? null) ||
      JSON.stringify(next.kit) !== JSON.stringify(prev.kit ?? null);

    if (changed.length === 0) {
      if (fingerprintChanged) {
        await gameDoc.ref.set(
          {
            pushPregame: {
              ...next,
              baselinedAt: Timestamp.now(),
            },
          },
          { merge: true }
        );
      }
      continue;
    }

    const gameId = gameDoc.id;
    const baseMatchup = resolveGameMatchupCopy(gameData);
    const predictorUids = [
      ...((
        await loadGamePredictorUids(firestore, [{ id: gameId, data: gameData }])
      ).get(gameId) ?? []),
    ];

    for (const type of changed) {
      const targets = targetsFromPredictorUids(gameId, type, predictorUids);
      if (targets.length === 0) continue;
      const matchup =
        type === "injury_status"
          ? {
              ...baseMatchup,
              detail: formatInjuryPushDetail(gameData.injuryReport),
            }
          : baseMatchup;
      const result = await sendExpoPushToUids({ type, targets, matchup });
      console.log(
        `[notifyPregameAlertCron] game=${gameId} type=${type} sent=${result.sent} targets=${targets.length}`
      );
    }

    await gameDoc.ref.set(
      {
        pushPregame: {
          ...next,
          notifiedAt: Timestamp.now(),
          lastKinds: changed,
        },
      },
      { merge: true }
    );
  }
}
