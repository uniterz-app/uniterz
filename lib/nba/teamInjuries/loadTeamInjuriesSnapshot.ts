import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type {
  NbaTeamInjuriesApiPayload,
  NbaTeamInjuriesBundle,
  NbaTeamInjuriesFirestoreDoc,
  NbaTeamInjuriesSnapshotSource,
  NbaTeamInjuryApiPayload,
  NbaTeamInjuryDocTeam,
} from "./teamInjuryTypes";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { normalizeTeamInjurySnapshotStatus } from "./injuryStatusDisplay";

export const NBA_TEAM_INJURIES_COLLECTION = "nbaTeamInjuries";

export function normalizeTeamInjuriesSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function resolveInjuryList(raw: unknown): NbaTeamInjuryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: NbaTeamInjuryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const playerId = String(row.playerId ?? "").trim();
    const name = String(row.name ?? "").trim();
    const status = normalizeTeamInjurySnapshotStatus(row.status);
    if (!playerId || !name || !status) continue;
    out.push({
      playerId,
      name,
      status,
      reason:
        typeof row.reason === "string" && row.reason.trim()
          ? row.reason.trim()
          : null,
      returnEstimate:
        typeof row.returnEstimate === "string" && row.returnEstimate.trim()
          ? row.returnEstimate.trim()
          : null,
    });
  }
  return out;
}

export function resolveTeamInjuriesFromFirestore(
  data: NbaTeamInjuriesFirestoreDoc | undefined | null,
  seasonKey: string
): {
  bundle: NbaTeamInjuriesBundle;
  source: NbaTeamInjuriesSnapshotSource;
  updatedAt: Date | null;
  teamCount: number;
} | null {
  if (!data || typeof data.teams !== "object" || data.teams == null) {
    return null;
  }
  const teams: Record<string, NbaTeamInjuryDocTeam> = {};
  for (const [teamId, raw] of Object.entries(
    data.teams as Record<string, unknown>
  )) {
    teams[teamId] = resolveInjuryList(raw);
  }
  const teamCount = Object.keys(teams).length;
  if (teamCount < 1) return null;

  const sourceRaw =
    typeof data.source === "string" ? data.source : "firestore";
  const source: NbaTeamInjuriesSnapshotSource =
    sourceRaw === "mock" || sourceRaw === "empty" || sourceRaw === "firestore"
      ? sourceRaw
      : "firestore";

  return {
    bundle: { seasonKey, teams },
    source,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
    teamCount,
  };
}

export async function loadTeamInjuriesSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamInjuriesApiPayload> {
  const key = normalizeTeamInjuriesSeasonKey(seasonKey);
  const snap = await db.collection(NBA_TEAM_INJURIES_COLLECTION).doc(key).get();
  const resolved = snap.exists
    ? resolveTeamInjuriesFromFirestore(
        snap.data() as NbaTeamInjuriesFirestoreDoc,
        key
      )
    : null;

  if (!resolved) {
    return {
      ok: true,
      season: key,
      bundle: { seasonKey: key, teams: {} },
      source: "empty",
      updatedAt: null,
      teamCount: 0,
    };
  }

  return {
    ok: true,
    season: key,
    bundle: resolved.bundle,
    source: resolved.source,
    updatedAt: resolved.updatedAt?.toISOString() ?? null,
    teamCount: resolved.teamCount,
  };
}

export async function loadTeamInjury(
  db: Firestore,
  seasonKey: string,
  teamId: string
): Promise<NbaTeamInjuryApiPayload> {
  const payload = await loadTeamInjuriesSnapshot(db, seasonKey);
  const id = teamId.trim();
  return {
    ok: true,
    season: payload.season,
    teamId: id,
    injuries: payload.bundle.teams[id] ?? [],
    source: payload.source,
    updatedAt: payload.updatedAt,
  };
}

export async function writeTeamInjuriesSnapshot(
  db: Firestore,
  seasonKey: string,
  teams: Record<string, NbaTeamInjuryDocTeam>,
  meta: {
    source: NbaTeamInjuriesSnapshotSource;
    serverTimestamp: unknown;
  }
): Promise<{ teamCount: number }> {
  const key = normalizeTeamInjuriesSeasonKey(seasonKey);
  const teamCount = Object.keys(teams).length;
  await db.collection(NBA_TEAM_INJURIES_COLLECTION).doc(key).set({
    seasonKey: key,
    source: meta.source,
    teamCount,
    teams,
    updatedAt: meta.serverTimestamp,
  });
  return { teamCount };
}
