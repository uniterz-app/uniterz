import type { ResultDayPointsHeader } from "@/app/component/result/ResultDayPipeGroup";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  hasPointsV3Recorded,
  sumDayPointsV3,
  type PostWithMillis,
} from "@/lib/result/result-page-data";

function predictionWinState(post: PostWithMillis): boolean | null {
  const iw = post.stats?.isWin;
  if (iw === true) return true;
  if (iw === false) return false;
  const wc = post.stats?.pointsV3Detail?.winnerCorrect;
  if (wc === true) return true;
  if (wc === false) return false;
  return null;
}

/** 勝者予想が true/false で判定できる投稿だけ数え、的中数を返す */
export function countWinnerHits(posts: readonly PostWithMillis[]): {
  wins: number;
  total: number;
} {
  let wins = 0;
  let total = 0;
  for (const p of posts) {
    const w = predictionWinState(p);
    if (w === null) continue;
    total += 1;
    if (w === true) wins += 1;
  }
  return { wins, total };
}

/** 日付行の得点表示（フィルタ後の確定分を合計。数値は強調表示用に分割） */
export function dayPointsHeaderForList(
  finalShown: PostWithMillis[],
  pendingShown: PostWithMillis[],
  language: Language
): ResultDayPointsHeader {
  const msg = t(language);
  if (finalShown.length > 0 && finalShown.every(hasPointsV3Recorded)) {
    const total = sumDayPointsV3(finalShown);
    const fmt =
      Number.isInteger(total) || Math.abs(total - Math.round(total)) < 1e-6
        ? String(Math.round(total))
        : total.toFixed(1);
    const { wins: hitWins, total: hitTotal } = countWinnerHits(finalShown);
    const hitSuffix =
      hitTotal > 0
        ? ` ${msg.results.hitWinsSummary.replace("{hits}", String(hitWins)).replace("{total}", String(hitTotal))}`
        : "";
    return {
      variant: "total",
      value: fmt,
      prefix: msg.results.dayTotalScore,
      unit: msg.results.dayTotalScorePts,
      aria: `${msg.results.dayTotalScoreAria.replace("{pts}", fmt)}${hitSuffix}`,
      ...(hitTotal > 0 ? { hitWins, hitTotal } : {}),
    };
  }
  if (finalShown.length > 0 || pendingShown.length > 0) {
    return {
      variant: "pending",
      line: msg.results.dayPending,
      aria: msg.results.dayPendingDesc,
    };
  }
  return null;
}
