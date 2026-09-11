/**
 * SCHEDULE ファクト（試合全体 cap 2）。
 * 差優先 → 無ければ片側負荷。オープナー埋め草・Cup・強豪次戦は出さない。
 */
import {
  formatTravelKm,
  shouldShowTonightTravel,
  shouldShowTwoDayTravel,
  type NbaTravelStop,
} from "@/lib/nba/nbaArenaTravel";
import { travelSummaryForBrief } from "@/lib/predict/nbaProBriefTravel";
import {
  proInsightTeamAbbr,
  proInsightTravelHopEn,
} from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import { computeRestDays } from "@/lib/nba/insights/buildScheduleLines";
import type { ProInsightFact } from "@/lib/nba/insights/proInsightFacts/types";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import {
  venueLocalHourAt,
  venueTzShiftHours,
} from "@/lib/nba/nbaTeamVenueTz";

const DAY_MS = 24 * 60 * 60 * 1000;
const TZ_WINDOW_MS = 72 * 60 * 60 * 1000;
const LATE_FINAL_HOUR = 22;
const EARLY_TIP_HOUR = 15;
const TZ_SHIFT_MIN_H = 2;
const LONG_ROAD_MIN = 4;

/** 常に差扱い（比較・複合） */
const INHERENT_DIFF_KINDS = new Set([
  "rest_advantage",
  "rest_disadvantage",
  "away_b2b",
  "travel_b2b",
  "ot_b2b",
  "ot_travel",
  "ot_travel_b2b",
  "late_to_early",
  "timezone_shift",
  "eastbound_trip",
  "soft_landing",
]);

/** 片方だけ立つとき差扱い */
const ASYMMETRIC_DIFF_KINDS = new Set([
  "travel_load",
  "long_road_trip",
  "road_trip_finale",
  "first_home_after_trip",
  "same_city_b2b_relief",
  "late_ot",
  "ot_minutes_load",
  "single_game_road_trip",
  "post_ot",
  "home_after_b2b",
]);

export type SchedulePriorGame = {
  startAtMs: number;
  venueTeamId: string;
  isHome: boolean;
  overtime?: boolean;
  finalAtMs?: number | null;
  gameId?: string;
  /** CONTEXT margin / streak 用（無い試合は点差集計から除外） */
  homeScore?: number | null;
  awayScore?: number | null;
};

export type ScheduleNextGame = {
  startAtMs: number;
  venueTeamId: string;
  isHome: boolean;
};

export type HighMinutePlayer = {
  teamId: string;
  playerName: string;
  minutes: number;
  playerId?: string;
};

function fact(partial: Omit<ProInsightFact, "section" | "mode" | "players"> & {
  players?: ProInsightFact["players"];
  mode?: ProInsightFact["mode"];
}): ProInsightFact {
  return {
    section: "SCHEDULE",
    ...partial,
    mode: partial.mode ?? "neutral",
    players: partial.players ?? [],
  };
}

function countVenueStreak(prior: SchedulePriorGame[], home: boolean): number {
  let n = 0;
  const sorted = [...prior].sort((a, b) => b.startAtMs - a.startAtMs);
  for (const g of sorted) {
    if (g.isHome !== home) break;
    n += 1;
  }
  return n;
}

function lastPrior(prior: SchedulePriorGame[]): SchedulePriorGame | null {
  return [...prior].sort((a, b) => b.startAtMs - a.startAtMs)[0] ?? null;
}

function travelForTeam(input: {
  teamId: string;
  tonightVenueTeamId: string;
  tipAtMs: number;
  priorGames: SchedulePriorGame[];
}) {
  const priorSorted = [...input.priorGames].sort(
    (a, b) => a.startAtMs - b.startAtMs
  );
  const recentStops: NbaTravelStop[] = priorSorted.slice(-4).map((g) => ({
    venueTeamId: g.venueTeamId,
    startAtMs: g.startAtMs,
  }));
  return travelSummaryForBrief({
    teamId: input.teamId,
    tonightVenueTeamId: input.tonightVenueTeamId,
    tonightStartAtMs: input.tipAtMs,
    recentStops,
  });
}

function maxTzShiftInWindow(input: {
  priorGames: SchedulePriorGame[];
  tonightVenueTeamId: string;
  tipAtMs: number;
}): { hours: number; eastbound: boolean } | null {
  const stops: Array<{ venueTeamId: string; startAtMs: number }> = [
    ...input.priorGames.map((g) => ({
      venueTeamId: g.venueTeamId,
      startAtMs: g.startAtMs,
    })),
    { venueTeamId: input.tonightVenueTeamId, startAtMs: input.tipAtMs },
  ].sort((a, b) => a.startAtMs - b.startAtMs);

  const windowStart = input.tipAtMs - TZ_WINDOW_MS;
  let best: { hours: number; eastbound: boolean } | null = null;
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1]!;
    const to = stops[i]!;
    if (to.startAtMs < windowStart) continue;
    const h = venueTzShiftHours(from.venueTeamId, to.venueTeamId, to.startAtMs);
    if (h == null) continue;
    const abs = Math.abs(h);
    if (abs < TZ_SHIFT_MIN_H) continue;
    if (!best || abs > Math.abs(best.hours)) {
      best = { hours: h, eastbound: h > 0 };
    }
  }
  return best;
}

function teamScheduleSide(input: {
  teamId: string;
  isHome: boolean;
  tonightVenueTeamId: string;
  tipAtMs: number;
  priorGames: SchedulePriorGame[];
  nextGame?: ScheduleNextGame | null;
  oppRest: number | null;
  highMinutePlayers: HighMinutePlayer[];
}): ProInsightFact[] {
  const facts: ProInsightFact[] = [];
  const abbr = proInsightTeamAbbr(input.teamId);
  const rest = computeRestDays({
    tipAtMs: input.tipAtMs,
    priorGames: input.priorGames,
  });
  const last = lastPrior(input.priorGames);
  const travel = travelForTeam(input);
  const hasTonightTravel =
    shouldShowTonightTravel(travel) && travel.tonightKm != null;
  const has48hTravel = shouldShowTwoDayTravel(travel);
  const hasTravel = hasTonightTravel || has48hTravel;
  const ot = Boolean(last?.overtime);
  const awayStreak = countVenueStreak(input.priorGames, false);
  const homeStreak = countVenueStreak(input.priorGames, true);
  const roadInclTonight = !input.isHome ? awayStreak + 1 : 0;
  const homeInclTonight = input.isHome ? homeStreak + 1 : 0;

  const hi = input.highMinutePlayers.filter(
    (p) => p.teamId === input.teamId && p.minutes >= 36
  );

  // —— 高: rest advantage / disadvantage ——
  if (rest != null && input.oppRest != null) {
    if (rest >= 1 && input.oppRest === 0) {
      facts.push(
        fact({
          id: `sched:restAdv:${input.teamId}`,
          kind: "rest_advantage",
          score: 24,
          teamIds: [input.teamId],
          label: "REST_ADV",
          metrics: [
            { key: "restDays", value: String(rest), teamId: input.teamId },
            { key: "oppRestDays", value: "0" },
          ],
          dedupeKeys: [`rest_adv:${input.teamId}`, `b2b:opp`],
          hintEn: `${abbr} has ${rest} day(s) rest vs an opponent on a back-to-back.`,
        })
      );
    }
    if (rest === 0 && input.oppRest >= 1) {
      facts.push(
        fact({
          id: `sched:restDis:${input.teamId}`,
          kind: "rest_disadvantage",
          score: 24,
          teamIds: [input.teamId],
          label: "REST_DIS",
          metrics: [
            { key: "restDays", value: "0", teamId: input.teamId },
            {
              key: "oppRestDays",
              value: String(input.oppRest),
            },
          ],
          dedupeKeys: [`rest_dis:${input.teamId}`, `b2b:${input.teamId}`],
          hintEn: `${abbr} on a back-to-back while opponent has ${input.oppRest} day(s) rest.`,
        })
      );
    }
  }

  // —— 高: away_b2b / travel_b2b / same_city ——
  if (rest === 0 && !input.isHome) {
    facts.push(
      fact({
        id: `sched:awayB2b:${input.teamId}`,
        kind: "away_b2b",
        score: 23,
        teamIds: [input.teamId],
        label: "AWAY_B2B",
        metrics: [
          { key: "restDays", value: "0", teamId: input.teamId },
          { key: "venue", value: "away", teamId: input.teamId },
        ],
        dedupeKeys: [`away_b2b:${input.teamId}`, `b2b:${input.teamId}`],
        hintEn: `${abbr} playing the second night of a back-to-back on the road.`,
      })
    );
  }

  if (rest === 0 && hasTravel && travel.tonightKm != null) {
    const hop = proInsightTravelHopEn(
      travel.tonightFromId,
      travel.tonightToId
    );
    const km = formatTravelKm(travel.tonightKm);
    facts.push(
      fact({
        id: `sched:travelB2b:${input.teamId}`,
        kind: "travel_b2b",
        score: 23,
        teamIds: [input.teamId],
        label: "TRAVEL_B2B",
        metrics: [
          { key: "hop", value: hop, teamId: input.teamId },
          { key: "tonightKm", value: km, teamId: input.teamId },
        ],
        dedupeKeys: [`travel_b2b:${input.teamId}`, `b2b:${input.teamId}`],
        hintEn: `${abbr} on a back-to-back with travel ${hop} (${km}).`,
      })
    );
  } else if (rest === 0 && !hasTravel) {
    facts.push(
      fact({
        id: `sched:sameCityB2b:${input.teamId}`,
        kind: "same_city_b2b_relief",
        score: 14,
        teamIds: [input.teamId],
        label: "B2B_NO_TRAVEL",
        metrics: [{ key: "restDays", value: "0", teamId: input.teamId }],
        dedupeKeys: [`same_city_b2b:${input.teamId}`],
        hintEn: `${abbr} on a back-to-back but without a long travel leg.`,
      })
    );
  }

  // —— OT 複合 ——
  if (ot && rest === 0 && hasTravel) {
    facts.push(
      fact({
        id: `sched:otTravelB2b:${input.teamId}`,
        kind: "ot_travel_b2b",
        score: 26,
        teamIds: [input.teamId],
        label: "OT_TRAVEL_B2B",
        metrics: [{ key: "lastOt", value: "1", teamId: input.teamId }],
        dedupeKeys: [
          `ot_travel_b2b:${input.teamId}`,
          `ot:${input.teamId}`,
          `b2b:${input.teamId}`,
        ],
        hintEn: `${abbr} coming off overtime, traveled, and plays again on no rest.`,
      })
    );
  } else if (ot && rest === 0) {
    facts.push(
      fact({
        id: `sched:otB2b:${input.teamId}`,
        kind: "ot_b2b",
        score: 25,
        teamIds: [input.teamId],
        label: "OT_B2B",
        metrics: [{ key: "lastOt", value: "1", teamId: input.teamId }],
        dedupeKeys: [`ot_b2b:${input.teamId}`, `ot:${input.teamId}`, `b2b:${input.teamId}`],
        hintEn: `${abbr} coming off overtime into a back-to-back.`,
      })
    );
  } else if (ot && hasTravel) {
    facts.push(
      fact({
        id: `sched:otTravel:${input.teamId}`,
        kind: "ot_travel",
        score: 22,
        teamIds: [input.teamId],
        label: "OT_TRAVEL",
        metrics: [{ key: "lastOt", value: "1", teamId: input.teamId }],
        dedupeKeys: [`ot_travel:${input.teamId}`, `ot:${input.teamId}`],
        hintEn: `${abbr} coming off overtime with travel into tonight.`,
      })
    );
  } else if (ot) {
    facts.push(
      fact({
        id: `sched:postOt:${input.teamId}`,
        kind: "post_ot",
        score: 12,
        teamIds: [input.teamId],
        label: "POST_OT",
        metrics: [{ key: "lastOt", value: "1", teamId: input.teamId }],
        dedupeKeys: [`ot:${input.teamId}`],
        hintEn: `${abbr} coming off overtime.`,
      })
    );
  }

  if (ot && hi.length >= 2) {
    facts.push(
      fact({
        id: `sched:otMin:${input.teamId}`,
        kind: "ot_minutes_load",
        score: 15 + Math.min(hi.length, 3),
        teamIds: [input.teamId],
        label: "OT_MIN36",
        metrics: hi.slice(0, 3).map((p) => ({
          key: "minutes",
          value: `${p.playerName} ${Math.round(p.minutes)}`,
          teamId: input.teamId,
        })),
        players: hi.slice(0, 3).map((p) => ({
          playerId: p.playerId ?? "",
          playerName: p.playerName,
        })),
        dedupeKeys: [`ot_min36:${input.teamId}`],
        hintEn: `${abbr} had ${hi.length} players at 36+ minutes in an overtime game.`,
      })
    );
  }

  // —— late_to_early / late_ot ——
  const finalAt = last?.finalAtMs;
  if (finalAt != null && last) {
    const endHour = venueLocalHourAt(last.venueTeamId, finalAt);
    const tipHour = venueLocalHourAt(input.tonightVenueTeamId, input.tipAtMs);
    if (
      endHour != null &&
      tipHour != null &&
      endHour >= LATE_FINAL_HOUR &&
      tipHour < EARLY_TIP_HOUR
    ) {
      facts.push(
        fact({
          id: `sched:lateEarly:${input.teamId}`,
          kind: "late_to_early",
          score: 21,
          teamIds: [input.teamId],
          label: "LATE_TO_EARLY",
          metrics: [
            { key: "finalLocalHour", value: String(endHour), teamId: input.teamId },
            { key: "tipLocalHour", value: String(tipHour), teamId: input.teamId },
          ],
          dedupeKeys: [`late_early:${input.teamId}`],
          hintEn: `${abbr} finished late locally (hour ${endHour}) and tips early tonight (hour ${tipHour}).`,
        })
      );
    }
    if (
      ot &&
      endHour != null &&
      endHour >= LATE_FINAL_HOUR &&
      rest != null &&
      rest <= 1
    ) {
      facts.push(
        fact({
          id: `sched:lateOt:${input.teamId}`,
          kind: "late_ot",
          score: 18,
          teamIds: [input.teamId],
          label: "LATE_OT",
          metrics: [
            { key: "finalLocalHour", value: String(endHour), teamId: input.teamId },
            { key: "restDays", value: String(rest), teamId: input.teamId },
          ],
          dedupeKeys: [`late_ot:${input.teamId}`, `ot:${input.teamId}`],
          hintEn: `${abbr} had a late overtime finish (hour ${endHour}) with rest ≤1 into tonight.`,
        })
      );
    }
  }

  // —— TZ ——
  const tz = maxTzShiftInWindow({
    priorGames: input.priorGames,
    tonightVenueTeamId: input.tonightVenueTeamId,
    tipAtMs: input.tipAtMs,
  });
  if (tz) {
    facts.push(
      fact({
        id: `sched:tz:${input.teamId}`,
        kind: "timezone_shift",
        score: 17 + Math.min(Math.floor(Math.abs(tz.hours)), 4),
        teamIds: [input.teamId],
        label: "TZ_SHIFT",
        metrics: [
          {
            key: "tzShiftHours",
            value: String(Math.round(tz.hours * 10) / 10),
            teamId: input.teamId,
          },
        ],
        dedupeKeys: [`tz:${input.teamId}`],
        hintEn: `${abbr} crossed ${Math.abs(tz.hours).toFixed(0)}h of timezone shift within 72h.`,
      })
    );
    if (tz.eastbound && rest != null && rest <= 1) {
      facts.push(
        fact({
          id: `sched:east:${input.teamId}`,
          kind: "eastbound_trip",
          score: 18,
          teamIds: [input.teamId],
          label: "EASTBOUND",
          metrics: [
            {
              key: "tzShiftHours",
              value: String(Math.round(tz.hours * 10) / 10),
              teamId: input.teamId,
            },
          ],
          dedupeKeys: [`eastbound:${input.teamId}`, `tz:${input.teamId}`],
          hintEn: `${abbr} traveling eastbound into a short-rest game.`,
        })
      );
    }
  }

  // —— road / home stands ——
  if (roadInclTonight >= LONG_ROAD_MIN) {
    facts.push(
      fact({
        id: `sched:longRoad:${input.teamId}`,
        kind: "long_road_trip",
        score: 16 + Math.min(roadInclTonight, 6),
        teamIds: [input.teamId],
        label: "LONG_ROAD",
        metrics: [
          {
            key: "roadTripGame",
            value: String(roadInclTonight),
            teamId: input.teamId,
          },
        ],
        dedupeKeys: [`long_road:${input.teamId}`],
        hintEn: `${abbr} on road trip game ${roadInclTonight}.`,
      })
    );
    const nextHome = input.nextGame?.isHome === true;
    if (nextHome) {
      facts.push(
        fact({
          id: `sched:roadFinale:${input.teamId}`,
          kind: "road_trip_finale",
          score: 17,
          teamIds: [input.teamId],
          label: "ROAD_FINALE",
          metrics: [
            {
              key: "roadTripGame",
              value: String(roadInclTonight),
              teamId: input.teamId,
            },
          ],
          dedupeKeys: [`road_finale:${input.teamId}`, `long_road:${input.teamId}`],
          hintEn: `${abbr} finale of a ${roadInclTonight}+ game road trip (next is home).`,
        })
      );
    }
  }

  if (input.isHome && awayStreak >= LONG_ROAD_MIN) {
    facts.push(
      fact({
        id: `sched:firstHome:${input.teamId}`,
        kind: "first_home_after_trip",
        score: 16,
        teamIds: [input.teamId],
        label: "FIRST_HOME",
        metrics: [
          {
            key: "priorRoadGames",
            value: String(awayStreak),
            teamId: input.teamId,
          },
        ],
        dedupeKeys: [`first_home:${input.teamId}`],
        hintEn: `${abbr} first home game after a ${awayStreak}-game road trip.`,
      })
    );
  }

  if (input.isHome && homeInclTonight >= 3) {
    facts.push(
      fact({
        id: `sched:homeStand:${input.teamId}`,
        kind: "home_stand",
        score: 9 + homeInclTonight,
        teamIds: [input.teamId],
        label: "HOME_STAND",
        metrics: [
          {
            key: "homeStandGame",
            value: String(homeInclTonight),
            teamId: input.teamId,
          },
        ],
        dedupeKeys: [`home_stand:${input.teamId}`],
        hintEn: `${abbr} home stand game ${homeInclTonight}.`,
      })
    );
  }

  // —— altitude ——
  if (input.tonightVenueTeamId === "nba-nuggets" && !input.isHome) {
    facts.push(
      fact({
        id: `sched:altitude:${input.teamId}`,
        kind: "altitude",
        score: 13,
        teamIds: [input.teamId],
        label: "ALTITUDE",
        metrics: [{ key: "venue", value: "DEN", teamId: input.teamId }],
        dedupeKeys: [`altitude:${input.teamId}`],
        hintEn: `${abbr} at altitude in Denver.`,
      })
    );
  }

  // —— travel_load（非 B2B 長距離）——
  if (rest !== 0 && hasTonightTravel && travel.tonightKm != null) {
    const hop = proInsightTravelHopEn(
      travel.tonightFromId,
      travel.tonightToId
    );
    const km = formatTravelKm(travel.tonightKm);
    facts.push(
      fact({
        id: `sched:travelLoad:${input.teamId}`,
        kind: "travel_load",
        score: 16 + Math.min(Math.floor(travel.tonightKm / 500), 6),
        teamIds: [input.teamId],
        label: "TRAVEL",
        metrics: [
          { key: "hop", value: hop, teamId: input.teamId },
          { key: "tonightKm", value: km, teamId: input.teamId },
        ],
        dedupeKeys: [`travel_load:${input.teamId}`],
        hintEn: `${abbr} travel tonight ${hop} (${km}).`,
      })
    );
  } else if (rest !== 0 && has48hTravel) {
    const km = formatTravelKm(travel.windowKm);
    facts.push(
      fact({
        id: `sched:travelLoad48:${input.teamId}`,
        kind: "travel_load",
        score: 15 + Math.min(Math.floor(travel.windowKm / 800), 5),
        teamIds: [input.teamId],
        label: "TRAVEL48H",
        metrics: [
          { key: "windowKm", value: km, teamId: input.teamId },
          {
            key: "windowLegs",
            value: String(travel.windowLegs),
            teamId: input.teamId,
          },
        ],
        dedupeKeys: [`travel_load:${input.teamId}`],
        hintEn: `${abbr} 48h travel load ${km} across ${travel.windowLegs} legs.`,
      })
    );
  }

  // —— 低: home_after_b2b / single_game_road / soft_landing ——
  if (input.isHome && last && !last.isHome) {
    const gapDays = Math.floor((input.tipAtMs - last.startAtMs) / DAY_MS);
    if (gapDays === 1) {
      // previous night was away → not exactly b2b home after; skip
    }
  }
  // B2B明けホーム: 前々試合との関係で「昨日がB2B2戦目だった」は難しい。
  // 簡易: rest>=1 かつ last がアウェイで、last の前が同日連戦寄り → rest===1 かつ last away で前試合から1日
  if (
    input.isHome &&
    rest != null &&
    rest >= 1 &&
    last &&
    !last.isHome
  ) {
    const prevRest = computeRestDays({
      tipAtMs: last.startAtMs,
      priorGames: input.priorGames.filter((g) => g.startAtMs < last.startAtMs),
    });
    if (prevRest === 0) {
      facts.push(
        fact({
          id: `sched:homeAfterB2b:${input.teamId}`,
          kind: "home_after_b2b",
          score: 10,
          teamIds: [input.teamId],
          label: "HOME_AFTER_B2B",
          metrics: [{ key: "restDays", value: String(rest), teamId: input.teamId }],
          dedupeKeys: [`home_after_b2b:${input.teamId}`],
          hintEn: `${abbr} home after wrapping a back-to-back (now ${rest} day(s) rest).`,
        })
      );
    }
  }

  if (!input.isHome && last?.isHome) {
    const nextHome = input.nextGame?.isHome === true;
    if (nextHome || input.nextGame == null) {
      // single game road: last home, tonight away, next home
      if (nextHome) {
        facts.push(
          fact({
            id: `sched:singleRoad:${input.teamId}`,
            kind: "single_game_road_trip",
            score: 11,
            teamIds: [input.teamId],
            label: "SINGLE_ROAD",
            metrics: [{ key: "venue", value: "away", teamId: input.teamId }],
            dedupeKeys: [`single_road:${input.teamId}`],
            hintEn: `${abbr} on a one-game road trip (home before and after).`,
          })
        );
      }
    }
  }

  if (
    rest === 0 &&
    input.oppRest != null &&
    input.oppRest === 0
  ) {
    facts.push(
      fact({
        id: `sched:softLand:${input.teamId}`,
        kind: "soft_landing",
        score: 11,
        teamIds: [input.teamId],
        label: "SOFT_LANDING",
        metrics: [{ key: "restDays", value: "0", teamId: input.teamId }],
        dedupeKeys: [`soft_landing:${input.teamId}`],
        hintEn: `${abbr} on a back-to-back but opponent is also on no rest.`,
      })
    );
  }

  // minutes without OT still useful as one-sided load
  if (!ot && hi.length >= 2) {
    facts.push(
      fact({
        id: `sched:min36:${input.teamId}`,
        kind: "minutes_36plus",
        score: 12 + Math.min(hi.length, 3),
        teamIds: [input.teamId],
        label: "MIN36",
        metrics: hi.slice(0, 3).map((p) => ({
          key: "minutes",
          value: `${p.playerName} ${Math.round(p.minutes)}`,
          teamId: input.teamId,
        })),
        players: hi.slice(0, 3).map((p) => ({
          playerId: p.playerId ?? "",
          playerName: p.playerName,
        })),
        dedupeKeys: [`min36:${input.teamId}`],
        hintEn: `${abbr} had ${hi.length} players at 36+ minutes last game.`,
      })
    );
  }

  return facts;
}

/**
 * 差（inherent / 非対称）があればそれだけ。無ければ片側負荷一式。
 */
export function selectScheduleFactsDifferentialFirst(
  facts: ProInsightFact[]
): ProInsightFact[] {
  const differential: ProInsightFact[] = [];
  const byKind = new Map<string, ProInsightFact[]>();

  for (const f of facts) {
    if (INHERENT_DIFF_KINDS.has(f.kind)) {
      differential.push(f);
      continue;
    }
    const list = byKind.get(f.kind) ?? [];
    list.push(f);
    byKind.set(f.kind, list);
  }

  for (const kind of ASYMMETRIC_DIFF_KINDS) {
    const list = byKind.get(kind) ?? [];
    if (list.length === 1) differential.push(list[0]!);
  }

  // altitude / home_stand / minutes when asymmetric
  for (const kind of ["altitude", "home_stand", "minutes_36plus"]) {
    const list = byKind.get(kind) ?? [];
    if (list.length === 1) differential.push(...list);
  }

  if (differential.length > 0) return differential;
  return facts;
}

export function buildScheduleFactCandidates(input: {
  phase: ProBriefPhase;
  homeTeamId: string;
  awayTeamId: string;
  tipAtMs: number;
  tonightVenueTeamId: string;
  homePriorGames: SchedulePriorGame[];
  awayPriorGames: SchedulePriorGame[];
  homeNextGame?: ScheduleNextGame | null;
  awayNextGame?: ScheduleNextGame | null;
  highMinutePlayers?: HighMinutePlayer[];
}): ProInsightFact[] {
  const hi = input.highMinutePlayers ?? [];
  const homeRest = computeRestDays({
    tipAtMs: input.tipAtMs,
    priorGames: input.homePriorGames,
  });
  const awayRest = computeRestDays({
    tipAtMs: input.tipAtMs,
    priorGames: input.awayPriorGames,
  });

  const facts: ProInsightFact[] = [
    ...teamScheduleSide({
      teamId: input.homeTeamId,
      isHome: true,
      tonightVenueTeamId: input.tonightVenueTeamId,
      tipAtMs: input.tipAtMs,
      priorGames: input.homePriorGames,
      nextGame: input.homeNextGame,
      oppRest: awayRest,
      highMinutePlayers: hi,
    }),
    ...teamScheduleSide({
      teamId: input.awayTeamId,
      isHome: false,
      tonightVenueTeamId: input.tonightVenueTeamId,
      tipAtMs: input.tipAtMs,
      priorGames: input.awayPriorGames,
      nextGame: input.awayNextGame,
      oppRest: homeRest,
      highMinutePlayers: hi,
    }),
  ];

  void input.phase;
  return selectScheduleFactsDifferentialFirst(facts);
}
