import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { buildResultShareUrl } from "@/lib/share/shareAppUrls";

export type ResultCardShareContext = {
  language: Language;
  homeName: string;
  awayName: string;
  predictedHome?: number | null;
  predictedAway?: number | null;
  finalHome?: number | null;
  finalAway?: number | null;
  totalPoints?: number | null;
  postId?: string | null;
  appBaseUrl?: string | null;
};

function formatScoreLine(
  home?: number | null,
  away?: number | null
): string | null {
  if (typeof home !== "number" || typeof away !== "number") return null;
  return `${home}-${away}`;
}

export { buildResultShareUrl as buildResultCardShareUrl };

/** リザルトカード共有用キャプション（予想・結果・総合得点 + URL） */
export function buildResultCardShareCaption(ctx: ResultCardShareContext): string {
  const r = t(ctx.language).results;
  const isJa = ctx.language === "ja";
  const matchup = isJa
    ? `${ctx.homeName} 対 ${ctx.awayName}`
    : `${ctx.homeName} vs ${ctx.awayName}`;

  const pred = formatScoreLine(ctx.predictedHome, ctx.predictedAway);
  const final = formatScoreLine(ctx.finalHome, ctx.finalAway);

  const parts: string[] = [matchup];

  if (pred) {
    parts.push(r.shareResultPrediction.replace("{score}", pred));
  }

  if (final) {
    parts.push(r.shareResultFinal.replace("{score}", final));
  }

  if (typeof ctx.totalPoints === "number" && Number.isFinite(ctx.totalPoints)) {
    const pts = (Math.round(ctx.totalPoints * 10) / 10).toFixed(1);
    parts.push(r.shareResultTotal.replace("{pts}", pts));
  }

  let caption = `${parts.join(isJa ? " · " : " · ")} #Uniterz`;

  const url = ctx.postId
    ? buildResultShareUrl(ctx.postId, ctx.appBaseUrl)
    : undefined;
  if (url) caption += `\n${url}`;

  return caption;
}
