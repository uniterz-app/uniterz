/**
 * CSS `linear-gradient(...)` から色ストップを雑に抜く（Native サムネ用）。
 * 完全パースはしない — `#rgb` / `#rrggbb` / `#rrggbbaa` のみ。
 */
export function parseCssLinearGradientColors(
  swatch: string,
  fallback: readonly [string, string] = ["#050810", "#0a1628"]
): [string, string, ...string[]] {
  const matches = swatch.match(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g);
  if (!matches || matches.length === 0) {
    return [fallback[0], fallback[1]];
  }
  const normalized = matches.map((hex) => {
    if (hex.length === 4) {
      const r = hex[1]!;
      const g = hex[2]!;
      const b = hex[3]!;
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    if (hex.length === 5) {
      const r = hex[1]!;
      const g = hex[2]!;
      const b = hex[3]!;
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    // drop alpha for RN solid stops
    if (hex.length === 9) return hex.slice(0, 7);
    return hex;
  });
  if (normalized.length === 1) {
    return [normalized[0]!, normalized[0]!];
  }
  return normalized as [string, string, ...string[]];
}
