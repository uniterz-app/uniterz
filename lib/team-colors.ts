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
  "nba-magic": "#0077C0",
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
  "nba-magic": "#000000",
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
 * ロスター HOME/AWAY・背番号枠用。
 * チーム色（jersey primary）を優先。黒・極暗色だけ secondary / UI 可読色へフォールバック
 * （readableTeamAccentOnDark のピンク寄せは使わない）。
 */
export function getTeamRosterMarkColor(
  league: League,
  teamId: string | null | undefined
): string {
  const primary = getTeamJerseyPrimaryColor(league, teamId);
  if (relativeLuminance(primary) >= 0.08) return primary;
  const secondary = getTeamJerseySecondaryColor(league, teamId);
  if (relativeLuminance(secondary) >= 0.08) return secondary;
  return getTeamUiAccentColor(league, teamId);
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

export type JerseyPalette = {
  /** 地（ボディ） */
  primary: string;
  /** 斜めライン等 */
  secondary: string;
};

function parseHexRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return null;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) return null;
  return { r, g, b };
}

function relativeLuminance(hex: string): number {
  const rgb = parseHexRgb(hex);
  if (!rgb) return 0.5;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function hexHue(hex: string): number | null {
  const rgb = parseHexRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 1e-6) return null;
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return h;
}

function hexSaturation(hex: string): number {
  const rgb = parseHexRgb(hex);
  if (!rgb) return 0;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max < 1e-6) return 0;
  return (max - min) / max;
}

const NEAR_BLACK_LUM = 0.08;
/** 市場バーで主色を副色に逃がすのは「ほぼ無彩の黒」だけ（ネッツ等） */
const NEAR_BLACK_SAT = 0.18;
/** 暗い有彩色は色相を保ったままここまで持ち上げる */
const MARKET_MIN_LUM = 0.16;
const FALLBACK_BLUE = "#2563EB";
const FALLBACK_SILVER = "#C8CDD4";
const FALLBACK_GOLD = "#F5C518";

function hexDistance(a: string, b: string): number {
  const ra = parseHexRgb(a);
  const rb = parseHexRgb(b);
  if (!ra || !rb) return 999;
  const dr = ra.r - rb.r;
  const dg = ra.g - rb.g;
  const db = ra.b - rb.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sameHex(a: string, b: string): boolean {
  return (
    a.replace("#", "").trim().toLowerCase() ===
    b.replace("#", "").trim().toLowerCase()
  );
}

function isNearBlackNeutral(hex: string): boolean {
  return (
    relativeLuminance(hex) < NEAR_BLACK_LUM && hexSaturation(hex) < NEAR_BLACK_SAT
  );
}

/** 暗い有彩色を同系のまま視認できる輝度まで持ち上げる（彩度ブーストしない） */
function liftDarkChromaticForMarket(hex: string): string {
  if (relativeLuminance(hex) >= MARKET_MIN_LUM) return hex;
  const rgb = parseHexRgb(hex);
  if (!rgb) return hex;

  const toHex = (r: number, g: number, b: number) => {
    const h = (n: number) =>
      Math.min(255, Math.max(0, Math.round(n)))
        .toString(16)
        .padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
  };

  // 白へ少しずつ混ぜて目標輝度へ（ネオン化・色相ズレを避ける）
  let lo = 0;
  let hi = 0.72;
  let best = hex;
  for (let i = 0; i < 14; i++) {
    const t = (lo + hi) / 2;
    const mixed = toHex(
      rgb.r + (255 - rgb.r) * t,
      rgb.g + (255 - rgb.g) * t,
      rgb.b + (255 - rgb.b) * t
    );
    best = mixed;
    if (relativeLuminance(mixed) < MARKET_MIN_LUM) lo = t;
    else hi = t;
  }
  return best;
}

/** 試合カードで主色が被って見えるか（同系色・黒同士・白同士） */
export function jerseyPrimariesClash(a: string, b: string): boolean {
  if (sameHex(a, b)) return true;
  if (hexDistance(a, b) < 55) return true;

  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  // 無彩の黒同士
  if (isNearBlackNeutral(a) && isNearBlackNeutral(b)) return true;
  // 白・シルバー同士（市場バーで溶け合う）
  if (
    la > 0.55 &&
    lb > 0.55 &&
    hexSaturation(a) < 0.3 &&
    hexSaturation(b) < 0.3 &&
    hexDistance(a, b) < 110
  ) {
    return true;
  }

  const sa = hexSaturation(a);
  const sb = hexSaturation(b);
  if (sa < 0.22 || sb < 0.22) return false;
  const ha = hexHue(a);
  const hb = hexHue(b);
  if (ha == null || hb == null) return false;
  let dh = Math.abs(ha - hb);
  if (dh > 180) dh = 360 - dh;
  return dh <= 30;
}

/**
 * 市場バー用のベース色。原則ユニフォーム主色。
 * 無彩の黒だけ secondary（ネッツ→白）。暗い紺・紫・ワインは同系のまま持ち上げる。
 */
function marketAccentFromJersey(
  league: League,
  teamId: string | null | undefined,
  preferred?: string
): string {
  const primary = getTeamJerseyPrimaryColor(league, teamId);
  let accent = preferred ?? primary;
  if (isNearBlackNeutral(accent)) {
    const secondary = getTeamJerseySecondaryColor(league, teamId);
    if (!isNearBlackNeutral(secondary)) {
      accent = secondary;
    } else {
      accent = FALLBACK_BLUE;
    }
  } else if (relativeLuminance(accent) < MARKET_MIN_LUM) {
    accent = liftDarkChromaticForMarket(accent);
  }
  return accent;
}

function distinctAlternateAccent(
  league: League,
  teamId: string | null | undefined,
  primary: string,
  otherAccent: string
): string {
  const secondary = getTeamJerseySecondaryColor(league, teamId);
  const secondaryForMarket = isNearBlackNeutral(secondary)
    ? null
    : relativeLuminance(secondary) < MARKET_MIN_LUM
      ? liftDarkChromaticForMarket(secondary)
      : secondary;
  if (
    secondaryForMarket &&
    !sameHex(secondary, primary) &&
    !jerseyPrimariesClash(secondaryForMarket, otherAccent)
  ) {
    return secondaryForMarket;
  }
  // 相手が明るい中立なら青、暗い／有彩なら銀〜金
  if (relativeLuminance(otherAccent) > 0.55 && hexSaturation(otherAccent) < 0.3) {
    return FALLBACK_BLUE;
  }
  if (relativeLuminance(otherAccent) < 0.35) {
    return FALLBACK_SILVER;
  }
  return FALLBACK_GOLD;
}

/**
 * 同系色対決時の UI アクセント（市場バー・トップスコアラータグ用）。
 * ユニフォーム mark 色は変えない。市場バーは主色ベース、衝突時だけ差し替え。
 */
export function resolveMatchupUiAccents(
  league: League,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): {
  homeAccent: string;
  awayAccent: string;
  clash: boolean;
} {
  const homePrimary = getTeamJerseyPrimaryColor(league, homeTeamId);
  const awayPrimary = getTeamJerseyPrimaryColor(league, awayTeamId);
  let homeAccent = marketAccentFromJersey(league, homeTeamId);
  let awayAccent = marketAccentFromJersey(league, awayTeamId);
  const clash =
    jerseyPrimariesClash(homePrimary, awayPrimary) ||
    jerseyPrimariesClash(homeAccent, awayAccent);

  if (!clash) {
    return { homeAccent, awayAccent, clash: false };
  }

  // アウェイ側を副色／代替色へ（ホームは主色寄りを維持）
  awayAccent = distinctAlternateAccent(
    league,
    awayTeamId,
    awayPrimary,
    homeAccent
  );
  // まだ被る場合はホーム側もずらす
  if (jerseyPrimariesClash(homeAccent, awayAccent)) {
    homeAccent = distinctAlternateAccent(
      league,
      homeTeamId,
      homePrimary,
      awayAccent
    );
  }

  return { homeAccent, awayAccent, clash: true };
}

/** マッチアップ内のチーム用アクセント（タグ塗りなど） */
export function matchupTeamUiAccent(
  league: League,
  teamId: string | null | undefined,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): string {
  const accents = resolveMatchupUiAccents(league, homeTeamId, awayTeamId);
  if (!teamId) return accents.homeAccent;
  if (teamId === homeTeamId) return accents.homeAccent;
  if (teamId === awayTeamId) return accents.awayAccent;
  return getTeamJerseyPrimaryColor(league, teamId);
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
