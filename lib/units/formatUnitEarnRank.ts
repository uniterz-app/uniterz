/**
 * Unit 獲得演出の順位表示 — `#8` ではなく `No. 8th` 形式。
 */
export function formatUnitEarnRankOrdinal(rank: number): string {
  const n = Math.max(1, Math.floor(rank));
  const mod100 = n % 100;
  const mod10 = n % 10;
  let suffix = "th";
  if (mod100 < 11 || mod100 > 13) {
    if (mod10 === 1) suffix = "st";
    else if (mod10 === 2) suffix = "nd";
    else if (mod10 === 3) suffix = "rd";
  }
  return `No. ${n}${suffix}`;
}
