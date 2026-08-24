/**
 * リーグ表などの選手名短縮。
 * 既定: `Luka Dončić` → `L.Doncic`
 * 例外: 長い定番名は通称（SGA など）
 */
const NAME_SUFFIX = /^(jr\.?|sr\.?|ii|iii|iv|v)$/i;

/** playerId（BDL）優先。なければ正規化氏名で照合。 */
const NBA_PLAYER_LIST_ALIAS_BY_ID: Record<string, string> = {
  // Shai Gilgeous-Alexander
  "175": "SGA",
  // Nickeil Alexander-Walker
  "666400": "NAW",
};

const NBA_PLAYER_LIST_ALIAS_BY_NAME: Record<string, string> = {
  "shai gilgeous-alexander": "SGA",
  "s. gilgeous-alexander": "SGA",
  "s gilgeous-alexander": "SGA",
  "nickeil alexander-walker": "NAW",
  "n. alexander-walker": "NAW",
  "n alexander-walker": "NAW",
};

function normalizeNameKey(fullName: string): string {
  return fullName
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function titleCaseToken(token: string): string {
  if (!token) return token;
  if (NAME_SUFFIX.test(token)) {
    const core = token.replace(/\.$/, "");
    if (/^jr$/i.test(core)) return "Jr.";
    if (/^sr$/i.test(core)) return "Sr.";
    return core.toUpperCase();
  }
  return token
    .split(/(['’-])/)
    .map((part) => {
      if (part === "'" || part === "’" || part === "-") return part;
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

/** リスト行・検索ヒット用の短縮表示名 */
export function formatNbaPlayerListName(
  fullName: string,
  playerId?: string | null
): string {
  if (playerId && NBA_PLAYER_LIST_ALIAS_BY_ID[playerId]) {
    return NBA_PLAYER_LIST_ALIAS_BY_ID[playerId]!;
  }
  const alias = NBA_PLAYER_LIST_ALIAS_BY_NAME[normalizeNameKey(fullName)];
  if (alias) return alias;

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fullName;
  if (parts.length === 1) return titleCaseToken(parts[0]!);
  const initial = parts[0]!.charAt(0).toUpperCase();
  const last = parts.slice(1).map(titleCaseToken).join(" ");
  return `${initial}.${last}`;
}

/** 詳細ヘッダーなど。通称があれば通称、なければフルネーム。 */
export function formatNbaPlayerDisplayName(
  firstName: string,
  lastName: string,
  playerId?: string | null
): string {
  const full = `${firstName} ${lastName}`.trim();
  if (playerId && NBA_PLAYER_LIST_ALIAS_BY_ID[playerId]) {
    return NBA_PLAYER_LIST_ALIAS_BY_ID[playerId]!;
  }
  const alias = NBA_PLAYER_LIST_ALIAS_BY_NAME[normalizeNameKey(full)];
  if (alias) return alias;
  return full;
}
