import type { League } from "@/lib/leagues";
import { teamColorsB1 } from "./teams-b1";
import { teamColorsJ1 } from "./teams-j1";
import { teamColorsNBA } from "./teams-nba";
import { teamColorsPL } from "./teams-pl";

/**
 * ユニフォーム mark 用 — 一目でチームがわかる公式寄り2色。
 * （単色寄せ・ネオン黄主導はやめ、primary / secondary をはっきり分ける）
 */
const jerseyPrimaryOverridesNBA: Record<string, string> = {
  "nba-hawks": "#E31837",
  "nba-celtics": "#007A33",
  "nba-nets": "#000000",
  "nba-hornets": "#00788C",
  "nba-bulls": "#E31837",
  "nba-cavaliers": "#860038",
  "nba-pistons": "#C8102E",
  "nba-pacers": "#003DA5",
  "nba-heat": "#C8102E",
  "nba-bucks": "#00471B",
  "nba-knicks": "#F58426",
  "nba-magic": "#000000",
  "nba-76ers": "#0B6BD8",
  "nba-raptors": "#E31837",
  "nba-wizards": "#002B5C",
  "nba-mavericks": "#0084F0",
  "nba-nuggets": "#FEC525",
  "nba-warriors": "#FDB927",
  "nba-rockets": "#F21C3A",
  "nba-clippers": "#1D428A",
  "nba-lakers": "#FDB927",
  "nba-grizzlies": "#7190C4",
  "nba-timberwolves": "#0C2340",
  "nba-pelicans": "#C8102E",
  "nba-thunder": "#F05333",
  "nba-suns": "#1D1160",
  "nba-blazers": "#E31837",
  "nba-kings": "#5A2D81",
  "nba-spurs": "#C4CED4",
  "nba-jazz": "#0077C0",
};

/** ユニフォーム mark の2色目（ストライプ／ドット対比用） */
const jerseySecondaryOverridesNBA: Record<string, string> = {
  "nba-hawks": "#FDBB30",
  "nba-celtics": "#FFFFFF",
  "nba-nets": "#FFFFFF",
  "nba-hornets": "#1D1160",
  "nba-bulls": "#000000",
  "nba-cavaliers": "#FDBB30",
  "nba-pistons": "#1D42BA",
  "nba-pacers": "#FDBB30",
  "nba-heat": "#FFFFFF",
  "nba-bucks": "#EEE1C6",
  "nba-knicks": "#006BB6",
  "nba-magic": "#0077C0",
  "nba-76ers": "#FFFFFF",
  "nba-raptors": "#000000",
  "nba-wizards": "#E31837",
  "nba-mavericks": "#B8C4CA",
  "nba-nuggets": "#0D2440",
  "nba-warriors": "#006BB6",
  "nba-rockets": "#000000",
  "nba-clippers": "#C8102E",
  "nba-lakers": "#000000",
  "nba-grizzlies": "#12173F",
  "nba-timberwolves": "#78BE20",
  "nba-pelicans": "#C5A017",
  "nba-thunder": "#0A7EC2",
  "nba-suns": "#E56020",
  "nba-blazers": "#000000",
  "nba-kings": "#C4CED4",
  "nba-spurs": "#000000",
  "nba-jazz": "#FFFFFF",
};
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

  // ネオンライム（旧 Lakers / Warriors jersey）→ 落ち着いたゴールドへ置換
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

/** 塗りの上に載せる文字色（暗い紺などでは白、明るい黄などは墨） */
export function contrastingInkOnHex(bgHex: string): string {
  const raw = bgHex.replace("#", "").trim();
  if (raw.length !== 6) return "#050508";
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) return "#050508";

  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum =
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  // Timberwolves 紺など低輝度は白字。スキャン線でさらに暗くなる分、閾値はやや高め
  return lum < 0.42 ? "#F5F7FA" : "#050508";
}

/** カード枠・セクションアクセント用（ジャージ mark は getTeamJerseyPrimaryColor のまま） */
export function getTeamUiAccentColor(
  league: League,
  teamId: string | null | undefined
): string {
  return readableTeamAccentOnDark(
    softenTeamUiColor(getTeamJerseyPrimaryColor(league, teamId))
  );
}

/**
 * 暗い背景上のテキスト／枠用。Kings 紫など低輝度を持ち上げて視認性を確保。
 */
export function readableTeamAccentOnDark(hex: string): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return hex;
  let r = Number.parseInt(raw.slice(0, 2), 16);
  let g = Number.parseInt(raw.slice(2, 4), 16);
  let b = Number.parseInt(raw.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) return hex;

  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum =
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  // 十分明るい色はそのまま（枠線でも読める）
  if (lum >= 0.32) return `#${raw.toUpperCase()}`;

  // 同系色のまま白へブレンドして輝度を上げる
  const t = Math.min(0.72, (0.38 - lum) / 0.38);
  const blend = 0.35 + t * 0.45;
  r = Math.round(r + (255 - r) * blend);
  g = Math.round(g + (255 - g) * blend);
  b = Math.round(b + (255 - b) * blend);
  const toHex = (n: number) =>
    Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** ユニフォーム canvas の2色目（NBA は jerseySecondaryOverrides 優先） */
export function getTeamJerseySecondaryColor(
  league: League,
  teamId: string | null | undefined
): string {
  if (league === "nba" && teamId && jerseySecondaryOverridesNBA[teamId]) {
    return jerseySecondaryOverridesNBA[teamId];
  }
  return getTeamSecondaryColor(league, teamId);
}

/** `#RRGGBB` → `rgba(...)`。UI の薄い塗り用。 */
export function teamColorRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) {
    return `rgba(255,255,255,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 塗りつぶし上の文字色（チェック等） */
export function teamColorOnFill(hex: string): "#050505" | "#ffffff" {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return "#ffffff";
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) return "#ffffff";
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.62 ? "#050505" : "#ffffff";
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

    default:
      return deriveSecondaryFromPrimary(primary);
  }
}
