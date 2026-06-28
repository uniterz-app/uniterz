import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";

/** `wcBracketResults/{season}.winners` — 公式ノックアウト勝者 */
export type WcOfficialWinners = Partial<
  Record<WcBracketPredictMatchId, string>
>;

export function parseWcOfficialWinnersDoc(data: unknown): WcOfficialWinners {
  if (!data || typeof data !== "object") return {};
  const raw = (data as { winners?: unknown }).winners;
  if (!raw || typeof raw !== "object") return {};

  const out: WcOfficialWinners = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim()) {
      out[key as WcBracketPredictMatchId] = value.trim();
    }
  }
  return out;
}
