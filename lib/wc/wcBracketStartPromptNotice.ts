import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";

/** Firestore `users/{uid}/reads/{id}` — 生涯1回表示 */
export function wcBracketStartPromptNoticeId(
  season = WC_KNOCKOUT_SEASON
): string {
  return `wc-bracket-start-prompt-${season}`;
}
