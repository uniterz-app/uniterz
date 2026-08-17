/**
 * Unit 獲得オーバーレイ — 入場アニメ案（プレビュー用メタ）。
 * 上質枠は「競技 HUD」寄り。フラッシュ・バウンド・ジャックポット感は避ける。
 */

export type UnitEarnOverlayAnimId =
  | "cinema"
  | "lock"
  | "press"
  | "depth"
  | "aperture"
  | "gilt"
  | "stagger"
  | "burst"
  | "rise"
  | "soft";

export type UnitEarnOverlayAnimVariant = {
  id: UnitEarnOverlayAnimId;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
  /** 上質枠。プレビュー上部に並べる */
  premium?: boolean;
};

export const UNIT_EARN_OVERLAY_ANIM_VARIANTS: readonly UnitEarnOverlayAnimVariant[] =
  [
    {
      id: "cinema",
      nameJa: "Cinema",
      nameEn: "Cinema",
      noteJa: "ぼかしが解けて焦点が合う。静かな映画的開示。",
      noteEn: "Blur clears into focus — cinematic, quiet.",
      premium: true,
    },
    {
      id: "lock",
      nameJa: "Lock",
      nameEn: "Lock",
      noteJa: "順位が先にロック。スコアボードが確定する感じ。",
      noteEn: "Rank locks first — scoreboard confirmation.",
      premium: true,
    },
    {
      id: "press",
      nameJa: "Press",
      nameEn: "Press",
      noteJa: "短い下降で着地。跳ねず、重みだけ残す。",
      noteEn: "Short decisive drop. Weight, no bounce.",
      premium: true,
    },
    {
      id: "depth",
      nameJa: "Depth",
      nameEn: "Depth",
      noteJa: "奥から手前へ。スケールは控えめ、奥行きで見せる。",
      noteEn: "From depth — restrained scale, spatial feel.",
      premium: true,
    },
    {
      id: "aperture",
      nameJa: "Aperture",
      nameEn: "Aperture",
      noteJa: "細いリングが開いてから情報が揃う。",
      noteEn: "Thin aperture ring opens, then content settles.",
      premium: true,
    },
    {
      id: "gilt",
      nameJa: "Gilt",
      nameEn: "Gilt",
      noteJa: "金額だけが淡く輝く。画面全体は光らせない。",
      noteEn: "Soft luminance on the prize only — no screen flash.",
      premium: true,
    },
    {
      id: "stagger",
      nameJa: "Stagger",
      nameEn: "Stagger",
      noteJa: "現行寄り。題名 → 順位 → 金額 → ボタン。",
      noteEn: "Production-like stagger.",
    },
    {
      id: "burst",
      nameJa: "Pulse",
      nameEn: "Pulse",
      noteJa: "金額だけわずかに膨らんで着地。中庸。",
      noteEn: "Gentle prize pulse — mid energy.",
    },
    {
      id: "rise",
      nameJa: "Rise",
      nameEn: "Rise",
      noteJa: "下からふわっと上昇。静かめ。",
      noteEn: "Soft rise from below.",
    },
    {
      id: "soft",
      nameJa: "Soft Fade",
      nameEn: "Soft Fade",
      noteJa: "フェードだけ。いちばん静か。",
      noteEn: "Softest — fades only.",
    },
  ] as const;

export const UNIT_EARN_OVERLAY_ANIM_SAMPLE = {
  titleJa: "招待が成立",
  titleEn: "Invite confirmed",
  subtitleJa: "友達招待ボーナス",
  subtitleEn: "Referral bonus",
  rank: null as number | null,
  amount: 10,
} as const;
