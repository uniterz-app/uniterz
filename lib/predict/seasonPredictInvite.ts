/**
 * Games 初回チュートリアル後（既存ユーザーは Games 表示時）に 1 回だけ出すシーズン予想の案内。Web / Native 共有。
 * 既読は端末ローカルに uid × シーズン単位（Web localStorage / Native AsyncStorage）。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { seasonPredictSubmitDeadlineLabel } from "@/lib/predict/seasonPredictDeadline";

/** チュートリアル終了・モーダル閉じから案内を出すまでの間 */
export const SEASON_PREDICT_INVITE_DELAY_MS = 800;

export function seasonPredictInviteStorageKey(uid: string): string {
  return `uniterz:seasonPredictInviteSeen:v1:${CURRENT_NBA_SEASON_KEY}:${uid}`;
}

export function readSeasonPredictInviteSeenWeb(uid: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return (
      window.localStorage.getItem(seasonPredictInviteStorageKey(uid)) === "1"
    );
  } catch {
    return true;
  }
}

export function writeSeasonPredictInviteSeenWeb(uid: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(seasonPredictInviteStorageKey(uid), "1");
  } catch {
    /* ignore */
  }
}

export type SeasonPredictInviteCopy = {
  eyebrow: string;
  title: string;
  body: string;
  deadlineLabel: string;
  deadline: string;
  later: string;
};

export function seasonPredictInviteCopy(
  language: string | null | undefined
): SeasonPredictInviteCopy {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: "SEASON PREDICT",
    title: L(lang, {
      ja: "開幕前にシーズン予想に参加しよう",
      en: "Make your season predictions before tip-off",
      ko: "개막 전에 시즌 예측에 참여하세요",
      zh: "开幕前参与赛季预测",
      es: "Haz tus predicciones de temporada antes del inicio",
      pt: "Faça seus palpites da temporada antes da estreia",
      fr: "Faites vos pronostics de saison avant l’ouverture",
    }),
    body: L(lang, {
      ja: "MVP などのアワードと、東西の最終順位を予想できます。提出はシーズンに 1 回だけ。未提出のあいだは、左上のアイコンに黄色い点が付きます。",
      en: "Pick the award winners (MVP and more) and the final East / West standings. One submission per season. Until you submit, the top-left icons show a yellow dot.",
      ko: "MVP 등 어워드와 동·서부 최종 순위를 예측할 수 있습니다. 제출은 시즌당 1회. 미제출 동안 왼쪽 위 아이콘에 노란 점이 표시됩니다.",
      zh: "可以预测 MVP 等奖项以及东西部最终排名。每个赛季只能提交一次。未提交期间，左上角图标会显示黄色圆点。",
      es: "Elige los premios (MVP y más) y la clasificación final del Este y Oeste. Un envío por temporada. Hasta que envíes, los íconos de arriba a la izquierda muestran un punto amarillo.",
      pt: "Escolha os prêmios (MVP e outros) e a classificação final do Leste e Oeste. Um envio por temporada. Até enviar, os ícones no canto superior esquerdo mostram um ponto amarelo.",
      fr: "Choisissez les trophées (MVP, etc.) et le classement final Est / Ouest. Un seul envoi par saison. Tant que vous n’avez pas envoyé, les icônes en haut à gauche affichent un point jaune.",
    }),
    deadlineLabel: L(lang, {
      ja: "提出期限",
      en: "Deadline",
      ko: "제출 기한",
      zh: "提交期限",
      es: "Fecha límite",
      pt: "Prazo",
      fr: "Date limite",
    }),
    deadline: seasonPredictSubmitDeadlineLabel(lang),
    later: L(lang, {
      ja: "あとで",
      en: "Later",
      ko: "나중에",
      zh: "稍后",
      es: "Más tarde",
      pt: "Depois",
      fr: "Plus tard",
    }),
  };
}
