/**
 * 静的 H2H（左/右固定）を、試合カードのホーム左・アウェイ右に揃えるための名前マッチ。
 * 表示略称（OKC 等）と Firestore のフルネームの両方に対応する。
 */

function normalizeH2hTeamKey(v: string | undefined): string {
  return (v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** 同一チームとみなすトークン群（いずれかが含まれればグループ内は同一） */
const TEAM_TOKEN_GROUPS: readonly string[][] = [
  ["okc", "thunder", "oklahomacity"],
  ["76ers", "sixers", "philadelphia"],
  ["wolves", "timberwolves", "minnesota"],
  ["blazers", "trailblazers", "portland"],
  ["warriors", "goldenstate"],
  ["knicks", "newyork"],
  ["lakers", "losangeles"],
  ["clippers", "laclippers"],
  ["cavs", "cavaliers", "cleveland"],
  ["pistons", "detroit"],
  ["spurs", "sanantonio"],
  ["magic", "orlando"],
  ["hornets", "charlotte"],
  ["heat", "miami"],
  ["hawks", "atlanta"],
  ["raptors", "toronto"],
  ["nuggets", "denver"],
  ["suns", "phoenix"],
  ["rockets", "houston"],
  ["celtics", "boston"],
];

function expandTeamTokens(normalized: string): Set<string> {
  const out = new Set<string>([normalized]);
  if (!normalized) return out;
  for (const group of TEAM_TOKEN_GROUPS) {
    if (group.some((t) => normalized.includes(t) || t.includes(normalized))) {
      for (const t of group) out.add(t);
    }
  }
  return out;
}

function h2hTeamNamesMatch(a: string | undefined, b: string | undefined): boolean {
  const na = normalizeH2hTeamKey(a);
  const nb = normalizeH2hTeamKey(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  const ta = expandTeamTokens(na);
  const tb = expandTeamTokens(nb);
  for (const x of ta) {
    for (const y of tb) {
      if (x.includes(y) || y.includes(x)) return true;
    }
  }
  return false;
}

/** 静的 H2H の左列をホーム側に合わせるには反転が必要か */
export function shouldFlipH2hToMatchHomeAway({
  leftTeamDisplay,
  rightTeamDisplay,
  homeTeamName,
  awayTeamName,
}: {
  leftTeamDisplay: string;
  rightTeamDisplay: string;
  homeTeamName?: string;
  awayTeamName?: string;
}): boolean {
  if (
    h2hTeamNamesMatch(homeTeamName, leftTeamDisplay) &&
    h2hTeamNamesMatch(awayTeamName, rightTeamDisplay)
  ) {
    return false;
  }
  if (
    h2hTeamNamesMatch(homeTeamName, rightTeamDisplay) &&
    h2hTeamNamesMatch(awayTeamName, leftTeamDisplay)
  ) {
    return true;
  }
  return false;
}
