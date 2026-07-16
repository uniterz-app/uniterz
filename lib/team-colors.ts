import type { League } from "@/lib/leagues";
import { teamColorsB1 } from "./teams-b1";
import { teamColorsJ1 } from "./teams-j1";
import { teamColorsNBA } from "./teams-nba";
import { teamColorsPL } from "./teams-pl";
import { teamColorsWC } from "./teams-wc";

/** ユニフォーム専用の色上書き（まずはポストシーズン対象から段階的に調整） */
const jerseyPrimaryOverridesNBA: Record<string, string> = {
  "nba-76ers": "#003DA5",
  "nba-magic": "#0075BD",
  "nba-nuggets": "#FEC525",
  "nba-pistons": "#ED174C",
  "nba-hornets": "#1D8CAB",
  "nba-knicks": "#F48328",
  "nba-lakers": "#DFFE00",
  "nba-suns": "#E66226",
  "nba-timberwolves": "#0C2340",
  "nba-warriors": "#DFFE00",
  "nba-blazers": "#E13A3E",
  "nba-cavaliers": "#6F212F",
  "nba-celtics": "#BC9A5C",
  "nba-hawks": "#CC092F",
  "nba-raptors": "#BE0F34",
  "nba-rockets": "#D31145",
  "nba-spurs": "#C4CED4",
  "nba-thunder": "#F05133",
};

/** ユニフォームのグラデ終点を primary と同じにするチーム（単色に近い見た目） */
const jerseyGradientEndMatchesPrimaryNBA = new Set<string>([
  "nba-76ers",
  "nba-blazers",
  "nba-cavaliers",
  "nba-celtics",
  "nba-hawks",
  "nba-hornets",
  "nba-knicks",
  "nba-lakers",
  "nba-magic",
  "nba-nuggets",
  "nba-pistons",
  "nba-raptors",
  "nba-rockets",
  "nba-spurs",
  "nba-suns",
  "nba-thunder",
  "nba-timberwolves",
  "nba-warriors",
]);

/** マップに secondary が無いとき、primary からグラデーション用の2色目を生成する */
function deriveSecondaryFromPrimary(primaryHex: string): string {
  const hex = primaryHex.trim().replace(/^#/, "");
  let r = 128;
  let g = 128;
  let b = 128;
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  }
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#3d3d42";
  // 黒寄りにせず primary に白を混ぜた副色（ユニが暗くなり過ぎない）
  const mixWhite = 0.2;
  const rr = Math.min(255, Math.round(r * (1 - mixWhite) + 255 * mixWhite));
  const gg = Math.min(255, Math.round(g * (1 - mixWhite) + 255 * mixWhite));
  const bb = Math.min(255, Math.round(b * (1 - mixWhite) + 255 * mixWhite));
  return `#${[rr, gg, bb]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function getTeamPrimaryColor(
  league: League,
  teamId: string | null | undefined
): string {
  if (!teamId) return "#ffffff";

  switch (league) {
    case "bj":
      return teamColorsB1[teamId]?.primary ?? "#ffffff";

    case "j1":
      return teamColorsJ1[teamId]?.primary ?? "#ffffff";

    case "nba":
      return teamColorsNBA[teamId]?.primary ?? "#ffffff";

    case "pl":
      return teamColorsPL[teamId]?.primary ?? "#ffffff";

    case "wc":
      return teamColorsWC[teamId]?.primary ?? "#ffffff";

    default:
      return "#ffffff";
  }
}

/** ユニフォーム用 primary（未指定チームは通常のチームカラーを使う） */
export function getTeamJerseyPrimaryColor(
  league: League,
  teamId: string | null | undefined
): string {
  if (!teamId) return getTeamPrimaryColor(league, teamId);
  if (league === "nba") {
    return jerseyPrimaryOverridesNBA[teamId] ?? getTeamPrimaryColor(league, teamId);
  }
  return getTeamPrimaryColor(league, teamId);
}

/**
 * UI 枠・バッジ用。ネオン黄（Lakers/Warriors 等）を落ち着いたゴールドへ抑える。
 * ジャージ mark 本体には使わず、枠線・テキストアクセント向け。
 */
export function softenTeamUiColor(hex: string): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return hex;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) return hex;

  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  // 緑が強く乗るネオン黄は HSL 明度では拾えないため相対輝度で判定
  const lum =
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r / 255) h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g / 255) h = ((b / 255 - r / 255) / d + 2) * 60;
    else h = ((r / 255 - g / 255) / d + 4) * 60;
  }

  const yellowish = h >= 35 && h <= 100;
  // 明るすぎる黄・ライムのみ（紫・シアン等は除外）
  if (!yellowish || lum < 0.55) return hex;

  // ネオンライム（Lakers / Warriors jersey）→ 落ち着いたゴールドへ置換
  if (b < 50 && g > 220 && r > 180) {
    return "#C5A817";
  }

  // 目標: 落ち着いたゴールド（輝度 ~0.44）
  const targetLum = 0.44;
  const factor = Math.min(1, Math.max(0.38, targetLum / lum));
  const nr = Math.round(r * factor);
  const ng = Math.round(g * factor * 0.95);
  const nb = Math.round(Math.min(b * factor + 18, Math.min(nr, ng) * 0.4));
  const toHex = (n: number) =>
    Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

/** カード枠・セクションアクセント用（ジャージ mark は getTeamJerseyPrimaryColor のまま） */
export function getTeamUiAccentColor(
  league: League,
  teamId: string | null | undefined
): string {
  return softenTeamUiColor(getTeamJerseyPrimaryColor(league, teamId));
}

/** ユニフォーム canvas の2色目（通常はチーム secondary、上記セットのチームは jersey primary と同色） */
export function getTeamJerseySecondaryColor(
  league: League,
  teamId: string | null | undefined
): string {
  if (
    league === "nba" &&
    teamId &&
    jerseyGradientEndMatchesPrimaryNBA.has(teamId)
  ) {
    return getTeamJerseyPrimaryColor(league, teamId);
  }
  return getTeamSecondaryColor(league, teamId);
}

export function getTeamSecondaryColor(
  league: League,
  teamId: string | null | undefined
): string {
  const primary = getTeamPrimaryColor(league, teamId);
  if (!teamId) return deriveSecondaryFromPrimary(primary);

  switch (league) {
    case "bj":
      return teamColorsB1[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    case "j1":
      return teamColorsJ1[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    case "nba":
      return teamColorsNBA[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    case "pl":
      return teamColorsPL[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    case "wc":
      return teamColorsWC[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    default:
      return deriveSecondaryFromPrimary(primary);
  }
}
