/**
 * PRO 背景 — Futuristic 案（採用: Eclipse / Data Stream）
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
        "radial-gradient(ellipse at 88% 78%, #e879f966 0%, transparent 42%), radial-gradient(ellipse at 28% 58%, #22d3ee44 0%, transparent 28%), linear-gradient(155deg, #020305, #0a1020 38%, #1a0a28 72%, #020305)",
      artId: "eclipse",
    },
    {
      id: "futuristic-data-stream",
      label: "Data Stream",
      tag: "データ流",
      description: "中下段を横切る多層ウェーブ。上は静か。",
      swatch:
        "linear-gradient(180deg, #020305 28%, #050a14 42%, #e879f955 52%, #a78bfa66 58%, #22d3ee55 68%, #050a14 78%, #020305)",
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
