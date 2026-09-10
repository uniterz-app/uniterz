import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
export type KinetikStreakVariant =
  | "rib-pulse"
  | "edge-march"
  | "corner-stack"
  | "frame-breath";

/** 本番採用: B案 エッジ走査 */
export const KINETIK_STREAK_VARIANT: KinetikStreakVariant = "edge-march";

export type KinetikStreakTier = 0 | 1 | 2 | 3 | 4;

/** 連勝タグを出し始める最低連勝数（リザルト IMPACT と同じ） */
export const KINETIK_STREAK_MIN_WINS = 3;

export function isKinetikWinStreakActive(streak: number): boolean {
  return Math.max(0, Math.floor(streak)) >= KINETIK_STREAK_MIN_WINS;
}

/** 連勝数 → 演出ティア（4連勝未満は 0） */
export function getKinetikStreakTier(streak: number): KinetikStreakTier {
  const n = Math.max(0, Math.floor(streak));
  if (n < KINETIK_STREAK_MIN_WINS) return 0;
  if (n <= 5) return 1;
  if (n <= 7) return 2;
  if (n <= 9) return 3;
  return 4;
}

/** edge-march 採用時のティア別カラーラベル（UI用） */
export function getKinetikStreakColorLabel(
  tier: KinetikStreakTier,
  language: "ja" | "en" = "ja"
): string {
  if (tier <= 2) return language === "ja" ? "緑" : "Green";
  if (tier === 3) return language === "ja" ? "シアン" : "Cyan";
  return language === "ja" ? "赤" : "Red";
}

export function formatKinetikWinStreakLabel(
  streak: number,
  _language: string | null | undefined = "ja"
): string {
  const n = Math.max(0, Math.floor(streak));
  if (!isKinetikWinStreakActive(n)) return "";
  return `W${n}`;
}

/** 連勝タグタップ時に表示する説明文 */
export function getKinetikWinStreakExplanation(
  streak: number,
  language: string | null | undefined = "ja"
): string {
  const lang = resolveLocalizedLang(language);
  const n = Math.max(0, Math.floor(streak));
  return L(lang, {
    ja: `${n}連勝（W${n}）\n\n今シーズン確定した予想が連続で的中しています。3連勝以上で表示され、連勝が伸びるほど色が変わります（3–4 鋼 / 5–6 シアン / 7–9 金 / 10+ 紅）。`,
    en: `${n} win streak (W${n})\n\nConfirmed picks have won ${n} games in a row this season. Shown at 3+ wins; color shifts as the streak grows (3–4 steel / 5–6 cyber / 7–9 gold / 10+ hot).`,
    ko: `${n}연승（W${n}）\n\n이번 시즌 확정 예상이 연속 적중 중입니다. 3연승 이상 표시되며 연승이 늘수록 색이 바뀝니다（3–4 강 / 5–6 시안 / 7–9 금 / 10+ 홍）.`,
    zh: `${n} 连胜（W${n}）\n\n本赛季已结算预测连续命中。3 连胜起显示，连胜越长颜色变化（3–4 钢 / 5–6 青 / 7–9 金 / 10+ 红）。`,
    es: `${n} racha (W${n})\n\nPicks confirmados han ganado ${n} seguidos esta temporada. Se muestra desde 3; el color cambia con la racha (3–4 acero / 5–6 cian / 7–9 oro / 10+ rojo).`,
    pt: `${n} sequência (W${n})\n\nPicks confirmados venceram ${n} seguidos nesta temporada. Aparece a partir de 3; a cor muda com a sequência (3–4 aço / 5–6 ciano / 7–9 ouro / 10+ vermelho).`,
    fr: `${n} série (W${n})\n\nDes picks confirmés ont gagné ${n} d’affilée cette saison. Affiché dès 3 ; la couleur évolue (3–4 acier / 5–6 cyan / 7–9 or / 10+ rouge).`,
  });
}

export const KINETIK_STREAK_VARIANTS: {
  id: KinetikStreakVariant;
  titleJa: string;
  titleEn: string;
  descJa: string;
}[] = [
  {
    id: "rib-pulse",
    titleJa: "A. リブ脈動",
    titleEn: "A. Rib Pulse",
    descJa: "左上/右下リブが静→脈動。連勝が伸びるほど周期が短く、内枠も明滅。",
  },
  {
    id: "edge-march",
    titleJa: "B. エッジ走査",
    titleEn: "B. Edge March",
    descJa:
      "L字ライン上を光点が走る。4–5連勝=緑 / 6–7=緑強 / 8–9=シアン / 10+=赤。高ティアで速度もUP。",
  },
  {
    id: "corner-stack",
    titleJa: "C. コーナー積層",
    titleEn: "C. Corner Stack",
    descJa: "TL/BR に横線が順番に点灯。連勝数に応じて線の本数が増える。",
  },
  {
    id: "frame-breath",
    titleJa: "D. フレーム呼吸",
    titleEn: "D. Frame Breath",
    descJa: "プレート枠だけがゆっくり明滅。最も控えめ。高連勝で振幅のみ微増。",
  },
];
