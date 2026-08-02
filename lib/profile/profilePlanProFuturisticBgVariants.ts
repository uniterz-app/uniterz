/**
 * PRO 背景 — Futuristic 案（採用: Eclipse / Data Stream のみ）
 */

export type ProfilePlanProFuturisticBgVariant =
  | "futuristic-eclipse"
  | "futuristic-data-stream";

export type ProfilePlanProFuturisticBgMeta = {
  id: ProfilePlanProFuturisticBgVariant;
  label: string;
  tag: string;
  description: string;
  swatch: string;
  /** WebFuturisticBackground / Native コンポーネントキー */
  artId: "eclipse" | "data-stream";
};

export const PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS: ProfilePlanProFuturisticBgMeta[] =
  [
    {
      id: "futuristic-eclipse",
      label: "Eclipse",
      tag: "食",
      description: "右下の巨大惑星リムと薄い軌道。中央は暗い余白。",
      swatch:
        "linear-gradient(155deg, #020305, #050c14 40%, #22d3ee33 78%, #a78bfa22 92%, #020305)",
      artId: "eclipse",
    },
    {
      id: "futuristic-data-stream",
      label: "Data Stream",
      tag: "データ流",
      description: "中下段を横切る多層ウェーブ。上は静か。",
      swatch:
        "linear-gradient(180deg, #020305 30%, #a78bfa33 55%, #22d3ee44 75%, #3b82f633)",
      artId: "data-stream",
    },
  ];

export function isProfilePlanProFuturisticBgVariant(
  v: string,
): v is ProfilePlanProFuturisticBgVariant {
  return PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS.some((e) => e.id === v);
}

export function getProfilePlanProFuturisticArtId(
  variant: ProfilePlanProFuturisticBgVariant,
): ProfilePlanProFuturisticBgMeta["artId"] {
  return (
    PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS.find((e) => e.id === variant)?.artId ??
    "eclipse"
  );
}
