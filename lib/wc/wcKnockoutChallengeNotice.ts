import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";

/** Firestore `users/{uid}/reads/{id}` — ノックアウトチャレンジ告知を生涯1回表示 */
export function wcKnockoutChallengeNoticeId(
  season = WC_KNOCKOUT_SEASON
): string {
  return `wc-knockout-challenge-prompt-${season}`;
}
