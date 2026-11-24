/**
 * BDL play-by-play → CLUTCH / PLAYTYPE / TRACK / HUSTLE。
 * クラッチ = 第 4Q 残り 5 分以降または延長、点差 5 点以内（プレー直前）。
 */
import {
  nbaClockToSeconds,
  type NbaPbpPlayLite,
} from "@/lib/nba/cleanRatings/computeNbaCleanRatings";
import type { BdlPlay } from "@/lib/nba/bdl/fetchBdlPlays";
import type {
  NbaGamePbpExtrasDoc,
  NbaPbpBox,
  NbaPbpClutchSide,
  NbaPbpHustle,
  NbaPbpPlaytypePts,
  NbaPbpTeamSlice,
  NbaPbpTrack,
  NbaPbpPlayerSlice,
} from "@/lib/nba/pbpExtras/nbaPbpExtrasTypes";

export type NbaPbpPlay = NbaPbpPlayLite & {
  text?: string | null;
  scoring_play?: boolean | null;
  score_value?: number | null;
};

type PlaytypeKey = keyof NbaPbpPlaytypePts;

function emptyBox(): NbaPbpBox {
  return { pts: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, fta: 0, oreb: 0, tov: 0 };
}

function emptyClutch(): NbaPbpClutchSide {
  return { ...emptyBox(), oppPts: 0 };
}

function emptyPlaytype(): NbaPbpPlaytypePts {
  return { iso: 0, pnrBh: 0, pnrRoll: 0, spotup: 0, trans: 0, cut: 0, post: 0 };
}

function emptyTrack(): NbaPbpTrack {
  return {
    drives: 0,
    drivePts: 0,
    pullupFgm: 0,
    pullupFga: 0,
    pullupPts: 0,
    cnsFgm: 0,
    cnsFga: 0,
    cnsPts: 0,
  };
}

function emptyHustle(): NbaPbpHustle {
  return { charges: 0, looseBalls: 0, deflections: 0 };
}

function emptyTeam(): NbaPbpTeamSlice {
  return {
    clutch: emptyClutch(),
    playtype: emptyPlaytype(),
    track: emptyTrack(),
    hustle: emptyHustle(),
  };
}

function emptyPlayer(teamId: string): NbaPbpPlayerSlice {
  return {
    t: teamId,
    clutch: emptyBox(),
    playtype: emptyPlaytype(),
    track: emptyTrack(),
    hustle: emptyHustle(),
  };
}

/** NBA クラッチ: 4Q 残り 5 分 or 延長、点差 5 以内 */
export function isNbaClutch(
  period: number,
  clockSec: number,
  margin: number
): boolean {
  if (Math.abs(margin) > 5) return false;
  if (period >= 5) return true;
  return period === 4 && clockSec <= 300;
}

function isFreeThrow(type: string): boolean {
  return type.startsWith("Free Throw");
}

function isTurnover(type: string): boolean {
  return /turnover/i.test(type) || type === "Traveling";
}

function isThree(type: string, text: string, scoreValue: number): boolean {
  if (scoreValue === 3) return true;
  return /3pt|three point|3-pt/i.test(`${type} ${text}`);
}

export function classifyPbpPlay(
  type: string,
  text: string
): {
  playtype: PlaytypeKey | null;
  drive: boolean;
  pullup: boolean;
  cns: boolean;
} {
  const blob = `${type} ${text}`.toLowerCase();
  const drive = /driv/.test(blob);
  const pullup = /pull\s*-?\s*up|step\s*-?\s*back/.test(blob);
  const running = /running|fast\s*break/.test(blob);
  const cutting = /cutt/.test(blob);
  const post = /hook|turnaround|post/.test(blob) && !/jump shot/.test(type.toLowerCase())
    ? true
    : /post\s*up/.test(blob);
  const alley = /alley\s*oop/.test(blob);
  const isoWord = /isolation/.test(blob);
  const screen = /screen|pick\s*(and|&|n)\s*roll/.test(blob);
  const jump = /jump shot|fadeaway|floater|floating/.test(blob);

  let playtype: PlaytypeKey | null = null;
  if (cutting) playtype = "cut";
  else if (running) playtype = "trans";
  else if (alley) playtype = "pnrRoll";
  else if (post) playtype = "post";
  else if (isoWord) playtype = "iso";
  else if (screen && (drive || pullup)) playtype = "pnrBh";
  else if (drive) playtype = "iso";
  else if (pullup) playtype = "iso";
  else if (jump) playtype = "spotup";

  const cns = playtype === "spotup" && !drive && !pullup && !running;
  return { playtype, drive, pullup, cns };
}

function firstParticipant(play: NbaPbpPlay): string | null {
  const id = play.participants?.[0];
  return typeof id === "number" && Number.isFinite(id) ? String(id) : null;
}

export function computeNbaGamePbpExtras(input: {
  plays: readonly (BdlPlay | NbaPbpPlay)[];
  seasonKey: string;
  date: string;
  homeBdlTeamId: number;
  awayBdlTeamId: number;
  homeTeamId: string;
  awayTeamId: string;
  nowMs: number;
}): NbaGamePbpExtrasDoc {
  const plays = [...input.plays].sort(
    (a, b) =>
      (a.period ?? 0) - (b.period ?? 0) ||
      (nbaClockToSeconds(b.clock) ?? 0) - (nbaClockToSeconds(a.clock) ?? 0) ||
      (a.order ?? 0) - (b.order ?? 0)
  );
  const home = emptyTeam();
  const away = emptyTeam();
  const players: Record<string, NbaPbpPlayerSlice> = {};
  let prevHome = 0;
  let prevAway = 0;

  const teamOf = (bdlId: number | undefined): "home" | "away" | null => {
    if (bdlId === input.homeBdlTeamId) return "home";
    if (bdlId === input.awayBdlTeamId) return "away";
    return null;
  };

  const player = (id: string, teamId: string): NbaPbpPlayerSlice => {
    const cur = players[id];
    if (cur) return cur;
    const created = emptyPlayer(teamId);
    players[id] = created;
    return created;
  };

  for (const raw of plays) {
    const p = raw as NbaPbpPlay;
    const period = typeof p.period === "number" ? p.period : 0;
    const clockSec = nbaClockToSeconds(p.clock);
    const margin = prevHome - prevAway;
    const clutch =
      clockSec != null && isNbaClutch(period, clockSec, margin);
    const type = String(p.type ?? "").trim();
    const text = String(p.text ?? "");
    const blob = `${type} ${text}`;
    const sideKey = teamOf(p.team?.id);
    const teamId =
      sideKey === "home"
        ? input.homeTeamId
        : sideKey === "away"
          ? input.awayTeamId
          : null;
    const teamSlice = sideKey === "home" ? home : sideKey === "away" ? away : null;
    const pid = firstParticipant(p);
    const pl = pid && teamId ? player(pid, teamId) : null;

    const h = typeof p.home_score === "number" ? p.home_score : prevHome;
    const a = typeof p.away_score === "number" ? p.away_score : prevAway;
    const dHome = h - prevHome;
    const dAway = a - prevAway;
    prevHome = h;
    prevAway = a;

    if (clutch) {
      if (dHome !== 0) {
        home.clutch.pts += dHome;
        away.clutch.oppPts += dHome;
      }
      if (dAway !== 0) {
        away.clutch.pts += dAway;
        home.clutch.oppPts += dAway;
      }
      if (pl && teamSlice) {
        const scored = sideKey === "home" ? dHome : dAway;
        if (scored > 0) {
          pl.clutch.pts += scored;
          pl.clutch.fgm += 1;
          if (scored === 3) pl.clutch.fg3m += 1;
        }
      }
    }

    if (!teamSlice || !teamId) continue;

    if (clutch) {
      if (isFreeThrow(type)) {
        teamSlice.clutch.fta += 1;
        if (pl) pl.clutch.fta += 1;
      } else if (p.shooting_play && type !== "No Shot (Default Shot)") {
        teamSlice.clutch.fga += 1;
        if (pl) pl.clutch.fga += 1;
        if (isThree(type, text, typeof p.score_value === "number" ? p.score_value : 0)) {
          teamSlice.clutch.fg3a += 1;
          if (pl) pl.clutch.fg3a += 1;
        }
        const scored = sideKey === "home" ? dHome : dAway;
        if (scored > 0) {
          teamSlice.clutch.fgm += 1;
          if (scored === 3) teamSlice.clutch.fg3m += 1;
        }
      } else if (type === "Offensive Rebound" && (p.participants?.length ?? 0) > 0) {
        teamSlice.clutch.oreb += 1;
        if (pl) pl.clutch.oreb += 1;
      } else if (isTurnover(type)) {
        teamSlice.clutch.tov += 1;
        if (pl) pl.clutch.tov += 1;
      }
    }

    if (/charge/i.test(blob)) {
      teamSlice.hustle.charges += 1;
      if (pl) pl.hustle.charges += 1;
    }
    if (/loose\s*ball/i.test(blob)) {
      teamSlice.hustle.looseBalls += 1;
      if (pl) pl.hustle.looseBalls += 1;
    }
    if (/deflect/i.test(blob)) {
      teamSlice.hustle.deflections += 1;
      if (pl) pl.hustle.deflections += 1;
    }

    const shot =
      Boolean(p.shooting_play) && type !== "No Shot (Default Shot)" && !isFreeThrow(type);
    if (!shot) continue;
    const cls = classifyPbpPlay(type, text);
    const scored = sideKey === "home" ? dHome : dAway;
    const made = scored > 0;
    if (cls.playtype && made) {
      teamSlice.playtype[cls.playtype] += scored;
      if (pl) pl.playtype[cls.playtype] += scored;
    }
    if (cls.drive) {
      teamSlice.track.drives += 1;
      if (made) teamSlice.track.drivePts += scored;
      if (pl) {
        pl.track.drives += 1;
        if (made) pl.track.drivePts += scored;
      }
    }
    if (cls.pullup) {
      teamSlice.track.pullupFga += 1;
      if (made) {
        teamSlice.track.pullupFgm += 1;
        teamSlice.track.pullupPts += scored;
      }
      if (pl) {
        pl.track.pullupFga += 1;
        if (made) {
          pl.track.pullupFgm += 1;
          pl.track.pullupPts += scored;
        }
      }
    }
    if (cls.cns) {
      teamSlice.track.cnsFga += 1;
      if (made) {
        teamSlice.track.cnsFgm += 1;
        teamSlice.track.cnsPts += scored;
      }
      if (pl) {
        pl.track.cnsFga += 1;
        if (made) {
          pl.track.cnsFgm += 1;
          pl.track.cnsPts += scored;
        }
      }
    }
  }

  return {
    seasonKey: input.seasonKey,
    date: input.date,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    home,
    away,
    players,
    builtAtMs: input.nowMs,
  };
}
