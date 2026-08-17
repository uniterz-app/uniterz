/** PRO カード豪華化 — /dev/profile-plan-pro-luxury-showcase */

export type ProfilePlanProLuxuryVariant =
  | "sweep"
  | "header-deck"
  | "name-gradient"
  | "unified-glass"
  | "depth-separation"
  | "avatar-pedestal"
  | "scope-stage"
  | "streak-frame";

export type ProfilePlanProLuxuryVariantMeta = {
  id: ProfilePlanProLuxuryVariant;
  label: string;
  tag: string;
  description: string;
};

export const PROFILE_PLAN_PRO_LUXURY_VARIANTS: ProfilePlanProLuxuryVariantMeta[] =
  [
    {
      id: "sweep",
      label: "Border Sweep",
      tag: "案1",
      description: "外枠スイープを強化。光が周回するコックピット枠。",
    },
    {
      id: "header-deck",
      label: "Header Deck",
      tag: "案2",
      description: "アバター〜名前の背面にガラス帯。Command Deck 感。",
    },
    {
      id: "name-gradient",
      label: "Name Gradient",
      tag: "案3",
      description: "表示名をシアン→紫グラデに。PRO バッジは維持。",
    },
    {
      id: "unified-glass",
      label: "Unified Glass",
      tag: "案4",
      description: "メトリクス4枚を統一ガラス板。色は左バーだけ。",
    },
    {
      id: "depth-separation",
      label: "Depth Separation",
      tag: "案5",
      description: "Tunnel の手前に暗いスクリム。展示ケース感。",
    },
    {
      id: "avatar-pedestal",
      label: "Avatar Pedestal",
      tag: "案6",
      description: "アバター下に発光台座。レア枠感。",
    },
    {
      id: "scope-stage",
      label: "Scope Stage",
      tag: "案7",
      description: "種目ピッカーを HUD トラフ（凹みステージ）に。",
    },
    {
      id: "streak-frame",
      label: "Streak Frame",
      tag: "案8",
      description: "連勝 tier に合わせて外枠グローを強調（6連勝想定）。",
    },
  ];

export function profilePlanProLuxuryClass(
  variant?: ProfilePlanProLuxuryVariant
): string {
  return variant ? `profile-plan-pro-luxury--${variant}` : "";
}
