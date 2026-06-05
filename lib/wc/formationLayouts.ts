// lib/wc/formationLayouts.ts

import type { WcFormationCode, WcLineupSlot } from "./squadTypes";

export type FormationSlotTemplate = {
  slot: string;
  x: number;
  y: number;
};

const LAYOUTS: Record<WcFormationCode, FormationSlotTemplate[]> = {
  "4-3-3": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "LB", x: 14, y: 72 },
    { slot: "CB", x: 36, y: 75 },
    { slot: "CB", x: 64, y: 75 },
    { slot: "RB", x: 86, y: 72 },
    { slot: "CM", x: 28, y: 52 },
    { slot: "CM", x: 50, y: 55 },
    { slot: "CM", x: 72, y: 52 },
    { slot: "LW", x: 16, y: 33 },
    { slot: "ST", x: 50, y: 30 },
    { slot: "RW", x: 84, y: 33 },
  ],
  "4-4-2": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "LB", x: 14, y: 72 },
    { slot: "CB", x: 36, y: 75 },
    { slot: "CB", x: 64, y: 75 },
    { slot: "RB", x: 86, y: 72 },
    { slot: "LM", x: 16, y: 48 },
    { slot: "CM", x: 38, y: 52 },
    { slot: "CM", x: 62, y: 52 },
    { slot: "RM", x: 84, y: 48 },
    { slot: "ST", x: 38, y: 30 },
    { slot: "ST", x: 62, y: 30 },
  ],
  "4-2-3-1": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "LB", x: 14, y: 72 },
    { slot: "CB", x: 36, y: 75 },
    { slot: "CB", x: 64, y: 75 },
    { slot: "RB", x: 86, y: 72 },
    { slot: "DM", x: 38, y: 58 },
    { slot: "DM", x: 62, y: 58 },
    { slot: "LW", x: 16, y: 40 },
    { slot: "AM", x: 50, y: 42 },
    { slot: "RW", x: 84, y: 40 },
    { slot: "ST", x: 50, y: 30 },
  ],
  "3-5-2": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "CB", x: 25, y: 75 },
    { slot: "CB", x: 50, y: 78 },
    { slot: "CB", x: 75, y: 75 },
    { slot: "LWB", x: 10, y: 52 },
    { slot: "CM", x: 32, y: 55 },
    { slot: "CM", x: 50, y: 58 },
    { slot: "CM", x: 68, y: 55 },
    { slot: "RWB", x: 90, y: 52 },
    { slot: "ST", x: 38, y: 30 },
    { slot: "ST", x: 62, y: 30 },
  ],
  "3-4-3": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "CB", x: 25, y: 75 },
    { slot: "CB", x: 50, y: 78 },
    { slot: "CB", x: 75, y: 75 },
    { slot: "LM", x: 14, y: 50 },
    { slot: "CM", x: 38, y: 54 },
    { slot: "CM", x: 62, y: 54 },
    { slot: "RM", x: 86, y: 50 },
    { slot: "LW", x: 18, y: 33 },
    { slot: "ST", x: 50, y: 30 },
    { slot: "RW", x: 82, y: 33 },
  ],
  "5-3-2": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "LWB", x: 10, y: 68 },
    { slot: "CB", x: 30, y: 76 },
    { slot: "CB", x: 50, y: 78 },
    { slot: "CB", x: 70, y: 76 },
    { slot: "RWB", x: 90, y: 68 },
    { slot: "CM", x: 30, y: 52 },
    { slot: "CM", x: 50, y: 55 },
    { slot: "CM", x: 70, y: 52 },
    { slot: "ST", x: 38, y: 30 },
    { slot: "ST", x: 62, y: 30 },
  ],
  "4-1-4-1": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "LB", x: 14, y: 72 },
    { slot: "CB", x: 36, y: 75 },
    { slot: "CB", x: 64, y: 75 },
    { slot: "RB", x: 86, y: 72 },
    { slot: "DM", x: 50, y: 60 },
    { slot: "LM", x: 16, y: 42 },
    { slot: "CM", x: 38, y: 45 },
    { slot: "CM", x: 62, y: 45 },
    { slot: "RM", x: 84, y: 42 },
    { slot: "ST", x: 50, y: 30 },
  ],
  "3-4-2-1": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "CB", x: 22, y: 76 },
    { slot: "CB", x: 50, y: 78 },
    { slot: "CB", x: 78, y: 76 },
    { slot: "LM", x: 12, y: 52 },
    { slot: "CM", x: 36, y: 55 },
    { slot: "CM", x: 64, y: 55 },
    { slot: "RM", x: 88, y: 52 },
    { slot: "AM", x: 35, y: 40 },
    { slot: "AM", x: 65, y: 40 },
    { slot: "ST", x: 50, y: 30 },
  ],
  "3-4-1-2": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "CB", x: 22, y: 76 },
    { slot: "CB", x: 50, y: 78 },
    { slot: "CB", x: 78, y: 76 },
    { slot: "LM", x: 12, y: 52 },
    { slot: "CM", x: 36, y: 55 },
    { slot: "CM", x: 64, y: 55 },
    { slot: "RM", x: 88, y: 52 },
    { slot: "AM", x: 50, y: 42 },
    { slot: "ST", x: 38, y: 30 },
    { slot: "ST", x: 62, y: 30 },
  ],
  "5-4-1": [
    { slot: "GK", x: 50, y: 90 },
    { slot: "LWB", x: 8, y: 70 },
    { slot: "CB", x: 28, y: 76 },
    { slot: "CB", x: 50, y: 78 },
    { slot: "CB", x: 72, y: 76 },
    { slot: "RWB", x: 92, y: 70 },
    { slot: "LM", x: 16, y: 48 },
    { slot: "CM", x: 38, y: 52 },
    { slot: "CM", x: 62, y: 52 },
    { slot: "RM", x: 84, y: 48 },
    { slot: "ST", x: 50, y: 30 },
  ],
};

export function getFormationLayout(
  formation: WcFormationCode,
): FormationSlotTemplate[] {
  return LAYOUTS[formation];
}

export function buildLineupSlots(
  formation: WcFormationCode,
  playerIds: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ],
): WcLineupSlot[] {
  const layout = getFormationLayout(formation);
  return layout.map((tpl, i) => ({
    playerId: playerIds[i],
    x: tpl.x,
    y: tpl.y,
  }));
}

export function squadPlayerId(iso3: string, slug: string): string {
  return `${iso3}-${slug}`;
}
