/**
 * OS 通知許可プライマー（Native）— 7言語
 */
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

export type PushPermissionPrimerSignal = {
  icon:
    | "timer-outline"
    | "flag-checkered"
    | "podium";
  label: string;
};

export type PushPermissionPrimerCopy = {
  title: string;
  body: string;
  allow: string;
  later: string;
  signals: readonly PushPermissionPrimerSignal[];
};

export function pushPermissionPrimerCopy(
  language: LocalizedLang | string
): PushPermissionPrimerCopy {
  const lang = resolveLocalizedLang(language);
  return {
    title: L(lang, {
      ja: "ALERTS をオンにする",
      en: "Turn on ALERTS",
      ko: "ALERTS 켜기",
      zh: "开启 ALERTS",
      es: "Activar ALERTS",
      pt: "Ativar ALERTS",
      fr: "Activer ALERTS",
    }),
    body: L(lang, {
      ja: "予想した試合だけ。種類はあとから設定で変えられます。",
      en: "Only games you predicted. Change types anytime in Settings.",
      ko: "예측한 경기만. 종류는 나중에 설정에서 바꿀 수 있습니다.",
      zh: "仅限你预测过的比赛。类型可随时在设置中更改。",
      es: "Solo partidos que prediciste. Cambia los tipos cuando quieras en Ajustes.",
      pt: "Só jogos que você palpitou. Mude os tipos quando quiser em Ajustes.",
      fr: "Uniquement les matchs prédits. Modifiez les types quand vous voulez dans Réglages.",
    }),
    allow: L(lang, {
      ja: "通知を許可",
      en: "Allow",
      ko: "알림 허용",
      zh: "允许通知",
      es: "Permitir",
      pt: "Permitir",
      fr: "Autoriser",
    }),
    later: L(lang, {
      ja: "あとで",
      en: "Not now",
      ko: "나중에",
      zh: "稍后",
      es: "Ahora no",
      pt: "Agora não",
      fr: "Plus tard",
    }),
    signals: [
      {
        icon: "timer-outline",
        label: L(lang, {
          ja: "試合開始・予想締切",
          en: "Tip-off & deadlines",
          ko: "경기 시작·예측 마감",
          zh: "开赛与预测截止",
          es: "Tip-off y plazos",
          pt: "Início e prazos",
          fr: "Tip-off et délais",
        }),
      },
      {
        icon: "flag-checkered",
        label: L(lang, {
          ja: "結果確定",
          en: "Final results",
          ko: "결과 확정",
          zh: "结果确定",
          es: "Resultados finales",
          pt: "Resultados finais",
          fr: "Résultats finaux",
        }),
      },
      {
        icon: "podium",
        label: L(lang, {
          ja: "ランキング更新",
          en: "Ranking updates",
          ko: "랭킹 업데이트",
          zh: "排名更新",
          es: "Actualizaciones de ranking",
          pt: "Atualizações de ranking",
          fr: "Mises à jour du classement",
        }),
      },
    ],
  };
}
