/**
 * プレシーズン試合を初めて「予想する」ときの告知（ランキング対象外）。Web / Native 共有。
 * 既読フラグは端末ローカル（Web localStorage / Native AsyncStorage）に uid 単位で持つ。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function preseasonPredictNoticeStorageKey(uid: string): string {
  return `uniterz:preseasonPredictNoticeSeen:v1:${uid}`;
}

/** 開始前のプレシーズン試合だけ（閲覧・編集では出さない） */
export function isPreseasonPredictNoticeTarget(
  game: { seasonPhase?: unknown; status?: unknown } | null | undefined
): boolean {
  if (!game) return false;
  return game.seasonPhase === "preseason" && game.status === "scheduled";
}

export function readPreseasonPredictNoticeSeenWeb(uid: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return (
      window.localStorage.getItem(preseasonPredictNoticeStorageKey(uid)) === "1"
    );
  } catch {
    return true;
  }
}

export function writePreseasonPredictNoticeSeenWeb(uid: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(preseasonPredictNoticeStorageKey(uid), "1");
  } catch {
    /* ignore */
  }
}

export type PreseasonPredictNoticeCopy = {
  eyebrow: string;
  title: string;
  body: string;
  ok: string;
};

export function preseasonPredictNoticeCopy(
  language: string | null | undefined
): PreseasonPredictNoticeCopy {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: "PRESEASON",
    title: L(lang, {
      ja: "プレシーズンはランキング対象外です",
      en: "Preseason doesn't count toward rankings",
      ko: "프리시즌은 랭킹에 포함되지 않습니다",
      zh: "季前赛不计入排名",
      es: "La pretemporada no cuenta para el ranking",
      pt: "A pré-temporada não conta para o ranking",
      fr: "La présaison ne compte pas pour le classement",
    }),
    body: L(lang, {
      ja: "プレシーズンの試合の予想は、ランキング（PICK UP / PRO LEAGUE）には反映されません。結果やその日の TODAY UNITERZ には反映されるので、開幕前の練習として気軽に予想してみましょう。",
      en: "Preseason picks don't count toward the PICK UP or PRO LEAGUE rankings. They still show in your results and that day's TODAY UNITERZ, so use them as warm-ups before opening night.",
      ko: "프리시즌 경기 예측은 랭킹(PICK UP / PRO LEAGUE)에 반영되지 않습니다. 결과와 당일 TODAY UNITERZ에는 반영되니 개막 전 연습으로 가볍게 예측해 보세요.",
      zh: "季前赛的预测不计入排名（PICK UP / PRO LEAGUE）。但会显示在结果和当天的 TODAY UNITERZ 中，可以当作开幕前的练习轻松预测。",
      es: "Las predicciones de pretemporada no cuentan para los rankings PICK UP ni PRO LEAGUE. Sí aparecen en tus resultados y en el TODAY UNITERZ del día, así que úsalas como calentamiento antes del inicio.",
      pt: "Os palpites da pré-temporada não contam para os rankings PICK UP ou PRO LEAGUE. Eles aparecem nos seus resultados e no TODAY UNITERZ do dia, então use como aquecimento antes da estreia.",
      fr: "Les pronostics de présaison ne comptent pas pour les classements PICK UP et PRO LEAGUE. Ils apparaissent dans vos résultats et dans le TODAY UNITERZ du jour : profitez-en pour vous échauffer avant l’ouverture.",
    }),
    ok: L(lang, {
      ja: "OK、予想する",
      en: "OK, predict",
      ko: "확인, 예측하기",
      zh: "好的，去预测",
      es: "OK, predecir",
      pt: "OK, palpitar",
      fr: "OK, pronostiquer",
    }),
  };
}
