/**
 * ドラフト詳細モーダル用 — テキスト中の NBA 略称をチームカラーで塗る分割。
 */
import { TEAM_SHORT } from "@/lib/team-short";
import { getTeamUiAccentColor } from "@/lib/team-colors";

const NBA_ABBR_TO_TEAM_ID: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [teamId, abbr] of Object.entries(TEAM_SHORT)) {
    if (!teamId.startsWith("nba-")) continue;
    const key = abbr.trim().toUpperCase();
    if (key) out[key] = teamId;
  }
  return out;
})();

const NBA_ABBR_PATTERN = (() => {
  const abbrs = Object.keys(NBA_ABBR_TO_TEAM_ID).sort(
    (a, b) => b.length - a.length
  );
  if (abbrs.length === 0) return null;
  return new RegExp(`\\b(${abbrs.map(escapeRegExp).join("|")})\\b`, "gi");
})();

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type DraftTeamColoredSeg = {
  text: string;
  /** null = 白系の通常テキスト */
  color: string | null;
};

export function nbaTeamIdForAbbr(
  abbr: string | null | undefined
): string | null {
  if (!abbr) return null;
  return NBA_ABBR_TO_TEAM_ID[abbr.trim().toUpperCase()] ?? null;
}

export function nbaAbbrAccentColor(
  abbr: string | null | undefined
): string | null {
  const teamId = nbaTeamIdForAbbr(abbr);
  if (!teamId) return null;
  return getTeamUiAccentColor("nba", teamId);
}

/** 本文を「通常 / チーム略称」のセグメントに分割 */
export function draftTextSegmentsWithTeamColors(
  raw: string
): DraftTeamColoredSeg[] {
  const text = raw ?? "";
  if (!text || !NBA_ABBR_PATTERN) return [{ text, color: null }];

  const segs: DraftTeamColoredSeg[] = [];
  let last = 0;
  const re = new RegExp(NBA_ABBR_PATTERN.source, NBA_ABBR_PATTERN.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) != null) {
    if (m.index > last) {
      segs.push({ text: text.slice(last, m.index), color: null });
    }
    const abbr = m[1] ?? m[0];
    segs.push({
      text: abbr,
      color: nbaAbbrAccentColor(abbr),
    });
    last = m.index + abbr.length;
  }
  if (last < text.length) {
    segs.push({ text: text.slice(last), color: null });
  }
  return segs.length > 0 ? segs : [{ text, color: null }];
}
