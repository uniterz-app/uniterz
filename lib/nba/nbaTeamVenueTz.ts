/**
 * NBA 本拠アリーナの IANA タイムゾーン（静的正データ）。
 * 会場移転が無い限り不変。SCHEDULE の時差・eastbound 用。
 */
export const NBA_TEAM_VENUE_TZ: Record<string, string> = {
  "nba-hawks": "America/New_York",
  "nba-celtics": "America/New_York",
  "nba-nets": "America/New_York",
  "nba-hornets": "America/New_York",
  "nba-bulls": "America/Chicago",
  "nba-cavaliers": "America/New_York",
  "nba-mavericks": "America/Chicago",
  "nba-nuggets": "America/Denver",
  "nba-pistons": "America/Detroit",
  "nba-warriors": "America/Los_Angeles",
  "nba-rockets": "America/Chicago",
  "nba-pacers": "America/Indiana/Indianapolis",
  "nba-clippers": "America/Los_Angeles",
  "nba-lakers": "America/Los_Angeles",
  "nba-grizzlies": "America/Chicago",
  "nba-heat": "America/New_York",
  "nba-bucks": "America/Chicago",
  "nba-timberwolves": "America/Chicago",
  "nba-pelicans": "America/Chicago",
  "nba-knicks": "America/New_York",
  "nba-thunder": "America/Chicago",
  "nba-magic": "America/New_York",
  "nba-76ers": "America/New_York",
  "nba-suns": "America/Phoenix",
  "nba-blazers": "America/Los_Angeles",
  "nba-kings": "America/Los_Angeles",
  "nba-spurs": "America/Chicago",
  "nba-raptors": "America/Toronto",
  "nba-jazz": "America/Denver",
  "nba-wizards": "America/New_York",
};

export function getNbaVenueTimeZone(teamId: string): string | null {
  const id = String(teamId ?? "").trim();
  if (!id) return null;
  return NBA_TEAM_VENUE_TZ[id] ?? null;
}

/** その瞬間の UTC オフセット（分）。東ほど大きい（EST=-300, PST=-480）。 */
export function venueUtcOffsetMinutesAt(
  teamId: string,
  atMs: number
): number | null {
  const tz = getNbaVenueTimeZone(teamId);
  if (!tz || !Number.isFinite(atMs)) return null;
  const d = new Date(atMs);
  const utc = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  const local = new Date(d.toLocaleString("en-US", { timeZone: tz }));
  return (local.getTime() - utc.getTime()) / 60000;
}

/** from → to の時差（時間）。正 = 東向き（例: LA→NY ≈ +3）。 */
export function venueTzShiftHours(
  fromTeamId: string,
  toTeamId: string,
  atMs: number
): number | null {
  const from = venueUtcOffsetMinutesAt(fromTeamId, atMs);
  const to = venueUtcOffsetMinutesAt(toTeamId, atMs);
  if (from == null || to == null) return null;
  return (to - from) / 60;
}

/** 会場ローカルの時（0–23） */
export function venueLocalHourAt(teamId: string, atMs: number): number | null {
  const tz = getNbaVenueTimeZone(teamId);
  if (!tz || !Number.isFinite(atMs)) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(atMs));
  const h = parts.find((p) => p.type === "hour")?.value;
  const n = h != null ? Number(h) : NaN;
  return Number.isFinite(n) ? n : null;
}
