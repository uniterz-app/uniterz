import type { CSSProperties } from "react";

/** 英語の序数（1st, 2nd, 3rd …）— チーム詳細のカンファレンス順位表示用 */
export function enOrdinal(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n}st`;
  if (m10 === 2 && m100 !== 12) return `${n}nd`;
  if (m10 === 3 && m100 !== 13) return `${n}rd`;
  return `${n}th`;
}

/** VS EAST/WEST の戦績数字と同じ色（ヒーローの EAST/WEST 表記でも使用） */
export const CONFERENCE_RECORD_STYLE: Record<"east" | "west", CSSProperties> = {
  east: {
    color: "#F87171",
    textShadow: "0 0 12px rgba(248,113,113,0.25)",
  },
  west: {
    color: "#5AC8FA",
    textShadow: "0 0 12px rgba(90,200,250,0.25)",
  },
};
