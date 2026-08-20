/**
 * リーグ表などの選手名: `Luka Dončić` → `L.Doncic` 形式。
 */
const NAME_SUFFIX = /^(jr\.?|sr\.?|ii|iii|iv|v)$/i;

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

export function formatNbaPlayerListName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fullName;
  if (parts.length === 1) return titleCaseToken(parts[0]!);
  const initial = parts[0]!.charAt(0).toUpperCase();
  const last = parts.slice(1).map(titleCaseToken).join(" ");
  return `${initial}.${last}`;
}
