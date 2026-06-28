import {
  formatWcDrawPotLabel,
  getWcDrawPot,
  resolveWcDrawPotColor,
  type WcDrawPotColor,
} from "@/lib/wc/drawPots";
import { WC_2026_KNOCKOUT_ADVANCEMENT } from "@/lib/wc/wc-knockout-advancement-2026";
import { resolveWcTeamQualLabel } from "@/lib/wc/wc-knockout-bracket-utils";

export type WcTeamFlagMeta =
  | {
      kind: "pot";
      label: string;
      potColor: WcDrawPotColor;
    }
  | {
      kind: "qual";
      label: string;
    };

/** 国旗上のメタ表示 — グループは Pot、ノックアウトは FIFA 表記（1F / 2D など） */
export function resolveWcTeamFlagMeta(
  teamId: string | null | undefined,
  options?: { knockout?: boolean }
): WcTeamFlagMeta | null {
  const id = String(teamId ?? "").trim();
  if (!id) return null;

  if (options?.knockout) {
    const qual = resolveWcTeamQualLabel(id, WC_2026_KNOCKOUT_ADVANCEMENT);
    return qual ? { kind: "qual", label: qual } : null;
  }

  const pot = getWcDrawPot(id);
  if (pot == null) return null;
  const potColor = resolveWcDrawPotColor(pot);
  if (!potColor) return null;
  return {
    kind: "pot",
    label: formatWcDrawPotLabel(pot),
    potColor,
  };
}
