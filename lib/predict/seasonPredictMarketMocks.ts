/**
 * シーズン予想マーケット — プレビュー用モック集計。
 * 本番 API 接続前に UI を本番相当で確認する。
 */
import {
  NBA_CONFERENCE_TEAM_IDS,
  NBA_STANDINGS_RANKS,
  type NbaConferenceId,
} from "@/lib/nba/nbaConferenceTeams";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  NBA_SEASON_AWARD_DEFS,
  type NbaAwardId,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import {
  AWARDS_PREVIEW_COACHES,
  AWARDS_PREVIEW_PLAYERS,
  AWARDS_PREVIEW_POPULAR,
} from "@/lib/predict/nbaSeasonAwardsPreviewMocks";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  bandIdForStandingsRank,
  type SeasonAwardsMarketAwardBlock,
  type SeasonAwardsMarketSnapshot,
  type SeasonStandingsMarketBandId,
  type SeasonStandingsMarketSnapshot,
  type SeasonStandingsTeamMarketRow,
} from "@/lib/predict/seasonPredictMarket";

const SUBMISSIONS = 428;

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashTeam(teamId: string): number {
  let h = 2166136261;
  for (let i = 0; i < teamId.length; i += 1) {
    h ^= teamId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** チームごとに「本命順位」付近に山を持つ分布を生成 */
function buildTeamRankWeights(
  teamId: string,
  indexInConference: number
): number[] {
  const rand = mulberry32(hashTeam(teamId) ^ 0x51f00d);
  // 強いチームほど上位寄り（index 小さいほど上位）
  const peak = Math.min(
    NBA_STANDINGS_RANKS,
    Math.max(1, Math.round(1 + indexInConference * 0.85 + (rand() - 0.5) * 2.2))
  );
  const weights: number[] = [];
  let sum = 0;
  for (let r = 1; r <= NBA_STANDINGS_RANKS; r += 1) {
    const dist = Math.abs(r - peak);
    const w = Math.exp(-dist * dist / (2 * 2.4 * 2.4)) * (0.55 + rand() * 0.9);
    weights.push(w);
    sum += w;
  }
  return weights.map((w) => w / sum);
}

function buildConferenceRows(
  conference: NbaConferenceId
): SeasonStandingsTeamMarketRow[] {
  const ids = NBA_CONFERENCE_TEAM_IDS[conference];
  const rows: SeasonStandingsTeamMarketRow[] = [];

  for (let i = 0; i < ids.length; i += 1) {
    const teamId = ids[i]!;
    const weights = buildTeamRankWeights(teamId, i);
    const picks = Math.max(
      12,
      Math.round(SUBMISSIONS * (0.55 + (hashTeam(teamId) % 40) / 100))
    );
    const rankPct = weights.map((w) => Math.round(w * 1000) / 10);
    // 正規化して合計 100 に寄せる
    const pctSum = rankPct.reduce((a, b) => a + b, 0) || 1;
    const normalized = rankPct.map((p) => Math.round((p / pctSum) * 1000) / 10);

    let modeRank = 1;
    let modePct = normalized[0] ?? 0;
    for (let r = 1; r < normalized.length; r += 1) {
      const p = normalized[r] ?? 0;
      if (p > modePct) {
        modePct = p;
        modeRank = r + 1;
      }
    }

    const bandPct: Record<SeasonStandingsMarketBandId, number> = {
      first: 0,
      straight: 0,
      playin: 0,
      out: 0,
    };
    for (let r = 0; r < normalized.length; r += 1) {
      const band = bandIdForStandingsRank(r + 1);
      bandPct[band] += normalized[r] ?? 0;
    }
    for (const key of Object.keys(bandPct) as SeasonStandingsMarketBandId[]) {
      bandPct[key] = Math.round(bandPct[key] * 10) / 10;
    }

    rows.push({
      teamId,
      conference,
      picks,
      modeRank,
      modePct,
      rankPct: normalized,
      bandPct,
    });
  }

  // 最多順位の強さ（modePct）→ 同率なら modeRank 昇順
  rows.sort((a, b) => {
    if (b.modePct !== a.modePct) return b.modePct - a.modePct;
    return a.modeRank - b.modeRank;
  });
  return rows;
}

export function buildSeasonStandingsMarketPreviewMock(
  season: string = CURRENT_NBA_SEASON_KEY
): SeasonStandingsMarketSnapshot {
  return {
    season,
    submissionCount: SUBMISSIONS,
    builtAtMs: Date.parse("2026-10-21T08:00:00+09:00"),
    east: buildConferenceRows("east"),
    west: buildConferenceRows("west"),
  };
}

function candidateName(id: string): { name: string; teamAbbr: string | null } {
  const all = [...AWARDS_PREVIEW_PLAYERS, ...AWARDS_PREVIEW_COACHES];
  const hit = all.find((c) => c.id === id);
  if (!hit) return { name: id, teamAbbr: null };
  return {
    name: `${hit.firstName} ${hit.lastName}`,
    teamAbbr: hit.teamAbbr ?? null,
  };
}

export function buildSeasonAwardsMarketPreviewMock(
  season: string = CURRENT_NBA_SEASON_KEY
): SeasonAwardsMarketSnapshot {
  const awards: SeasonAwardsMarketAwardBlock[] = NBA_SEASON_AWARD_DEFS.map(
    (def) => {
      const popular = AWARDS_PREVIEW_POPULAR[def.id as NbaAwardId] ?? [];
      const catalog =
        def.kind === "coach" ? AWARDS_PREVIEW_COACHES : AWARDS_PREVIEW_PLAYERS;
      const ids = [
        ...popular,
        ...catalog.map((c) => c.id).filter((id) => !popular.includes(id)),
      ].slice(0, 5);

      const raw = ids.map((_, i) => Math.max(4, 34 - i * 6 - (i === 0 ? 0 : 2)));
      const sum = raw.reduce((a, b) => a + b, 0) || 1;
      const top = ids.map((candidateId, i) => {
        const meta = candidateName(candidateId);
        const pct = Math.round((raw[i]! / sum) * 1000) / 10;
        return {
          candidateId,
          name: meta.name,
          teamAbbr: meta.teamAbbr ?? TEAM_SHORT[candidateId] ?? null,
          pct,
          picks: Math.round((pct / 100) * SUBMISSIONS),
        };
      });

      return {
        awardId: def.id,
        labelEn: def.labelEn,
        name: def.name,
        top,
      };
    }
  );

  return {
    season,
    submissionCount: SUBMISSIONS,
    builtAtMs: Date.parse("2026-10-21T08:00:00+09:00"),
    awards,
  };
}
