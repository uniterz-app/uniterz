// lib/events/eventRules.ts
export type GameEventTag = {
  label: string;
  color: "yellow" | "blue";
};

export function getGameEventTag(roundLabel?: string): GameEventTag | null {
  if (roundLabel === "RIVAL_WEEK") {
    return {
      label: "EVENT",
      color: "yellow",
    };
  }

  // 将来追加
  // if (roundLabel === "PLAYOFF") { ... }

  return null;
}
