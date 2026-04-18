type SeasonPhase = "regular" | "play_in" | "playoffs" | null | undefined;

/** ホーム・アウェイそれぞれのシリーズ勝数（ベストオブシリーズの途中経過） */
export type SeriesStanding = {
  homeWins: number;
  awayWins: number;
};

function toNonNegInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    const n = Math.floor(v);
    return n >= 0 ? n : null;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  return null;
}

/**
 * Firestore games などの生データからシリーズ勝ち負けを取り出す。
 * 運用で使うキーを複数サポートする。
 */
export function parseSeriesStandingFromRaw(
  raw: Record<string, unknown> | null | undefined
): SeriesStanding | null {
  if (!raw) return null;

  const seriesObj = raw.series as Record<string, unknown> | undefined;
  const standingObj = raw.seriesStanding as Record<string, unknown> | undefined;
  const recordObj = raw.seriesRecord as Record<string, unknown> | undefined;

  const homeWins =
    toNonNegInt(raw.seriesHomeWins) ??
    toNonNegInt(seriesObj?.home) ??
    toNonNegInt(seriesObj?.homeWins) ??
    toNonNegInt(standingObj?.homeWins) ??
    toNonNegInt(standingObj?.home) ??
    toNonNegInt(recordObj?.homeWins) ??
    toNonNegInt(recordObj?.home);

  const awayWins =
    toNonNegInt(raw.seriesAwayWins) ??
    toNonNegInt(seriesObj?.away) ??
    toNonNegInt(seriesObj?.awayWins) ??
    toNonNegInt(standingObj?.awayWins) ??
    toNonNegInt(standingObj?.away) ??
    toNonNegInt(recordObj?.awayWins) ??
    toNonNegInt(recordObj?.away);

  if (homeWins === null || awayWins === null) return null;
  return { homeWins, awayWins };
}

/** ラベルがプレーインか（シリーズ表記は出さない） */
function roundLabelIsPlayIn(roundLabel?: string | null): boolean {
  const s = (roundLabel ?? "").trim();
  if (!s) return false;
  const u = s.toUpperCase();
  if (u.includes("PLAY-IN") || u.includes("PLAY IN")) return true;
  return /プレーイン|PLAY\s*IN/i.test(s);
}

/**
 * プレーオフ（ベストオブシリーズ）の試合カードか。
 * プレーイン（play_in または PLAY-IN 表記）は対象外。
 */
export function isPlayoffStyleGameCard(
  seasonPhase: SeasonPhase,
  roundLabel?: string | null
): boolean {
  if (seasonPhase === "play_in") return false;
  if (roundLabelIsPlayIn(roundLabel)) return false;
  if (seasonPhase === "playoffs") return true;
  const s = (roundLabel ?? "").trim();
  if (!s) return false;
  const u = s.toUpperCase();
  if (u.includes("PLAYOFF")) return true;
  if (/プレーオフ/.test(s)) return true;
  return /PLAY\s*OFF/i.test(s);
}
