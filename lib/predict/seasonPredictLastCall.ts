/**
 * シーズン予想の締切前日リマインド（未提出の人だけ・締切 24 時間前から 1 回）。Web / Native 共有。
 * 通常の案内（`seasonPredictInvite`）と同じモーダルを文言だけ差し替えて使う。この窓では通常案内は出さない。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS,
  isSeasonPredictSubmitOpen,
} from "@/lib/predict/seasonPredictDeadline";
import type { SeasonPredictInviteCopy } from "@/lib/predict/seasonPredictInvite";

export const SEASON_PREDICT_LAST_CALL_START_MS =
  SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS - 24 * 60 * 60 * 1000;

export function isSeasonPredictLastCallWindow(nowMs: number = Date.now()): boolean {
  return nowMs >= SEASON_PREDICT_LAST_CALL_START_MS && isSeasonPredictSubmitOpen(nowMs);
}

export function seasonPredictLastCallStorageKey(uid: string): string {
  return `uniterz:seasonPredictLastCallSeen:v1:${CURRENT_NBA_SEASON_KEY}:${uid}`;
}

export function seasonPredictLastCallCopy(
  language: string | null | undefined,
  pending: { awards: boolean; standings: boolean },
  base: SeasonPredictInviteCopy,
  nowMs: number = Date.now()
): SeasonPredictInviteCopy {
  const lang = resolveLocalizedLang(language);
  const hours = Math.max(
    1,
    Math.ceil((SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS - nowMs) / (60 * 60 * 1000))
  );
  const title =
    pending.awards && pending.standings
      ? L(lang, {
          ja: "シーズン予想はもうした？",
          en: "Made your season predictions yet?",
          ko: "시즌 예측은 하셨나요?",
          zh: "赛季预测提交了吗？",
          es: "¿Ya hiciste tus predicciones de temporada?",
          pt: "Já fez seus palpites da temporada?",
          fr: "Avez-vous fait vos pronostics de saison ?",
        })
      : pending.awards
        ? L(lang, {
            ja: "アワード予想はもうした？",
            en: "Made your award picks yet?",
            ko: "어워드 예측은 하셨나요?",
            zh: "奖项预测提交了吗？",
            es: "¿Ya elegiste los premios?",
            pt: "Já escolheu os prêmios?",
            fr: "Avez-vous choisi vos trophées ?",
          })
        : L(lang, {
            ja: "順位予想はもうした？",
            en: "Made your standings picks yet?",
            ko: "순위 예측은 하셨나요?",
            zh: "排名预测提交了吗？",
            es: "¿Ya hiciste tu clasificación?",
            pt: "Já fez sua classificação?",
            fr: "Avez-vous fait votre classement ?",
          });
  return {
    ...base,
    eyebrow: "LAST CALL",
    title,
    body: L(lang, {
      ja: `締切まであと約 ${hours} 時間。開幕戦のティップオフで締め切られ、それ以降は提出できません。今季の予想を出して、シーズン終了まで楽しもう。`,
      en: `About ${hours} hours left. Picks lock at opening night tip-off and can't be submitted after that. Lock in yours and follow them all season.`,
      ko: `마감까지 약 ${hours}시간. 개막전 팁오프에 마감되며 이후에는 제출할 수 없습니다. 이번 시즌 예측을 내고 시즌 끝까지 즐기세요.`,
      zh: `距离截止还有约 ${hours} 小时。开幕战跳球时截止，之后无法提交。提交本赛季预测，一直玩到赛季结束吧。`,
      es: `Quedan unas ${hours} horas. Se cierra al salto inicial del debut y después no se puede enviar. Haz tus picks y síguelos toda la temporada.`,
      pt: `Faltam cerca de ${hours} horas. Fecha no tip-off da estreia e depois não dá para enviar. Faça seus palpites e acompanhe a temporada toda.`,
      fr: `Il reste environ ${hours} heures. Clôture au tip-off d’ouverture, plus d’envoi possible ensuite. Faites vos pronostics et suivez-les toute la saison.`,
    }),
  };
}
