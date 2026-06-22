/** localStorage: サッカー採点変更告知を端末ごとに1回だけ（ログイン状態に依存しない） */
export const FOOTBALL_SCORING_CHANGE_SEEN_STORAGE_KEY =
  "uniterz:footballScoringChangeSeen:v1";

export function readFootballScoringChangeSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(FOOTBALL_SCORING_CHANGE_SEEN_STORAGE_KEY) ===
      "1"
    );
  } catch {
    return false;
  }
}

export function markFootballScoringChangeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FOOTBALL_SCORING_CHANGE_SEEN_STORAGE_KEY, "1");
  } catch {
    // 容量超過などは握りつぶす
  }
}
