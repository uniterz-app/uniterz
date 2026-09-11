/**
 * 通知設定画面文言（7言語）。
 */
import type { PushNotificationPrefKey } from "@/lib/notifications/pushNotificationPrefs";
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

export type NotificationSettingsLang = LocalizedLang;

type PrefRowCopy = {
  key: PushNotificationPrefKey;
  title: string;
  desc: string;
};

export function notificationSettingsCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    title: L(lang, {
      ja: "通知設定",
      en: "Notifications",
      ko: "알림 설정",
      zh: "通知设置",
      es: "Notificaciones",
      pt: "Notificações",
      fr: "Notifications",
    }),
    description: L(lang, {
      ja: "受け取る通知の種類を選べます。端末の通知がオフの場合は届きません。",
      en: "Choose which notifications you receive. They won't arrive if system notifications are off.",
      ko: "받을 알림 종류를 선택할 수 있습니다. 기기 알림이 꺼져 있으면 오지 않습니다.",
      zh: "可选择接收的通知类型。系统通知关闭时不会送达。",
      es: "Elige qué notificaciones recibir. No llegarán si las del sistema están off.",
      pt: "Escolha quais notificações receber. Não chegam se as do sistema estiverem off.",
      fr: "Choisissez les notifications. Elles n’arrivent pas si le système est désactivé.",
    }),
    osSection: L(lang, {
      ja: "端末の通知",
      en: "Device notifications",
      ko: "기기 알림",
      zh: "设备通知",
      es: "Notificaciones del dispositivo",
      pt: "Notificações do dispositivo",
      fr: "Notifications de l’appareil",
    }),
    osGranted: L(lang, {
      ja: "許可済み",
      en: "Allowed",
      ko: "허용됨",
      zh: "已允许",
      es: "Permitido",
      pt: "Permitido",
      fr: "Autorisé",
    }),
    osDenied: L(lang, {
      ja: "オフ（システム設定で変更）",
      en: "Off (change in system settings)",
      ko: "꺼짐（시스템 설정에서 변경）",
      zh: "关闭（在系统设置中更改）",
      es: "Off (cámbialo en ajustes del sistema)",
      pt: "Off (altere nas configurações do sistema)",
      fr: "Off (changez dans les réglages système)",
    }),
    osUnknown: L(lang, {
      ja: "未設定",
      en: "Not set",
      ko: "미설정",
      zh: "未设置",
      es: "Sin configurar",
      pt: "Não definido",
      fr: "Non défini",
    }),
    osUnavailable: L(lang, {
      ja: "このビルドでは利用できません",
      en: "Unavailable in this build",
      ko: "이 빌드에서는 사용할 수 없습니다",
      zh: "此构建不可用",
      es: "No disponible en esta build",
      pt: "Indisponível nesta build",
      fr: "Indisponible dans cette build",
    }),
    allowBtn: L(lang, {
      ja: "通知を許可",
      en: "Allow notifications",
      ko: "알림 허용",
      zh: "允许通知",
      es: "Permitir notificaciones",
      pt: "Permitir notificações",
      fr: "Autoriser les notifications",
    }),
    openSettingsBtn: L(lang, {
      ja: "システム設定を開く",
      en: "Open system settings",
      ko: "시스템 설정 열기",
      zh: "打开系统设置",
      es: "Abrir ajustes del sistema",
      pt: "Abrir configurações do sistema",
      fr: "Ouvrir les réglages système",
    }),
    matchSection: L(lang, {
      ja: "試合の進行",
      en: "Match progress",
      ko: "경기 진행",
      zh: "比赛进程",
      es: "Progreso del partido",
      pt: "Andamento da partida",
      fr: "Déroulement du match",
    }),
    matchHint: L(lang, {
      ja: "予想した試合の結果・Unit、未予想の締切まとめ。",
      en: "Results and Units for matches you predicted — plus batched deadlines.",
      ko: "예약한 경기의 결과·Unit, 미예측 마감 요약.",
      zh: "已预测比赛的结果与 Unit，以及未预测截止汇总。",
      es: "Resultados y Units de partidos tipados — más plazos agrupados.",
      pt: "Resultados e Units das partidas tipadas — e prazos agrupados.",
      fr: "Résultats et Units des matchs tippés — plus deadlines groupées.",
    }),
    deadlineSection: L(lang, {
      ja: "締切の何分前",
      en: "Minutes before deadline",
      ko: "마감 몇 분 전",
      zh: "截止前几分钟",
      es: "Minutos antes del plazo",
      pt: "Minutos antes do prazo",
      fr: "Minutes avant la deadline",
    }),
    deadlineFreeHint: L(lang, {
      ja: "Free は 30 分前。60 / 10 分前は Pro。",
      en: "Free is 30 min. Pro unlocks 60 / 10.",
      ko: "Free는 30분 전. 60 / 10분은 Pro.",
      zh: "Free 为 30 分钟。60 / 10 分钟需 Pro。",
      es: "Free: 30 min. Pro desbloquea 60 / 10.",
      pt: "Free: 30 min. Pro libera 60 / 10.",
      fr: "Free : 30 min. Pro débloque 60 / 10.",
    }),
    reviewSection: L(lang, {
      ja: "予想を見直す",
      en: "Recheck alerts",
      ko: "예상 재확인",
      zh: "复查提醒",
      es: "Alertas de revisión",
      pt: "Alertas de revisão",
      fr: "Alertes de relecture",
    }),
    reviewHintPro: L(lang, {
      ja: "欠場・Insight など、予想を直すべき変化だけ。",
      en: "Only availability / Insight changes that warrant a recheck.",
      ko: "결장·Insight 등 예상을 고쳐야 할 변화만.",
      zh: "仅在缺阵 / Insight 等需要改预测时通知。",
      es: "Solo disponibilidad / Insight que justifiquen revisar.",
      pt: "Apenas disponibilidade / Insight que peçam revisão.",
      fr: "Uniquement disponibilité / Insight à revérifier.",
    }),
    reviewHintFree: L(lang, {
      ja: "出場ステータス・Insight・月次レポートは Pro で届きます。",
      en: "Availability, Insight, and monthly report are Pro.",
      ko: "출전 상태·Insight·월간 리포트는 Pro.",
      zh: "出场状态、Insight、月报为 Pro。",
      es: "Disponibilidad, Insight e informe mensual son Pro.",
      pt: "Disponibilidade, Insight e relatório mensal são Pro.",
      fr: "Disponibilité, Insight et rapport mensuel sont Pro.",
    }),
    requesting: L(lang, {
      ja: "確認中…",
      en: "Checking…",
      ko: "확인 중…",
      zh: "确认中…",
      es: "Comprobando…",
      pt: "Verificando…",
      fr: "Vérification…",
    }),
    openSettingsFail: L(lang, {
      ja: "設定アプリを開けませんでした。",
      en: "Could not open settings.",
      ko: "설정 앱을 열 수 없습니다.",
      zh: "无法打开设置。",
      es: "No se pudieron abrir los ajustes.",
      pt: "Não foi possível abrir as configurações.",
      fr: "Impossible d’ouvrir les réglages.",
    }),
    minutesShort: L(lang, {
      ja: "分前",
      en: "m",
      ko: "분 전",
      zh: "分钟前",
      es: "m",
      pt: "m",
      fr: "m",
    }),
    matchRows: matchPrefRows(lang),
    proRows: proPrefRows(lang),
  };
}

function matchPrefRows(lang: LocalizedLang): PrefRowCopy[] {
  return [
    {
      key: "gameFinal",
      title: L(lang, {
        ja: "結果確定",
        en: "Result confirmed",
        ko: "결과 확정",
        zh: "结果确认",
        es: "Resultado confirmado",
        pt: "Resultado confirmado",
        fr: "Résultat confirmé",
      }),
      desc: L(lang, {
        ja: "予想した試合の結果が確定したとき（スコアは出ません）",
        en: "When a match you predicted is finalized (no score spoiler)",
        ko: "예약한 경기 결과가 확정될 때（스코어 없음）",
        zh: "你预测的比赛结果确定时（不含比分）",
        es: "Cuando se finaliza un partido tipado (sin marcador)",
        pt: "Quando uma partida tipada é finalizada (sem placar)",
        fr: "Quand un match tippé est finalisé (sans score)",
      }),
    },
    {
      key: "predictionDeadline",
      title: L(lang, {
        ja: "予想締切",
        en: "Prediction deadline",
        ko: "예상 마감",
        zh: "预测截止",
        es: "Plazo de predicción",
        pt: "Prazo de palpite",
        fr: "Deadline de tip",
      }),
      desc: L(lang, {
        ja: "未予想だけ。複数あるときは1通にまとめる",
        en: "Unpredicted only — batched into one when several",
        ko: "미예측만. 여러 개면 1통으로 묶음",
        zh: "仅未预测。多场时合并为一则",
        es: "Solo sin tip — varias se agrupan en una",
        pt: "Só sem tip — várias viram uma",
        fr: "Non tippés seulement — regroupés en une si plusieurs",
      }),
    },
    {
      key: "unitReward",
      title: L(lang, {
        ja: "Unit 付与",
        en: "Unit rewards",
        ko: "Unit 지급",
        zh: "Unit 发放",
        es: "Recompensas Unit",
        pt: "Recompensas Unit",
        fr: "Récompenses Unit",
      }),
      desc: L(lang, {
        ja: "ランキング報酬の Unit が付与されたとき",
        en: "When ranking Unit rewards are granted",
        ko: "랭킹 Unit 보상이 지급될 때",
        zh: "发放排名 Unit 奖励时",
        es: "Cuando se otorgan Units de ranking",
        pt: "Quando Units de ranking são concedidos",
        fr: "Quand des Units de classement sont accordés",
      }),
    },
  ];
}

function proPrefRows(lang: LocalizedLang): PrefRowCopy[] {
  return [
    {
      key: "injuryStatus",
      title: L(lang, {
        ja: "出場ステータス変更",
        en: "Availability change",
        ko: "출전 상태 변경",
        zh: "出场状态变更",
        es: "Cambio de disponibilidad",
        pt: "Mudança de disponibilidade",
        fr: "Changement de disponibilité",
      }),
      desc: L(lang, {
        ja: "平均出場 25 分以上の選手の欠場・復帰など",
        en: "Out / return for players averaging 25+ minutes",
        ko: "평균 출전 25분 이상 선수의 결장·복귀 등",
        zh: "平均出场 25 分钟以上球员的缺阵/复出等",
        es: "Baja / regreso de jugadores con 25+ min de media",
        pt: "Fora / retorno de jogadores com média 25+ min",
        fr: "Absent / retour pour joueurs à 25+ min de moyenne",
      }),
    },
    {
      key: "proInsightUpdate",
      title: L(lang, {
        ja: "PRO INSIGHT 重要更新",
        en: "PRO INSIGHT update",
        ko: "PRO INSIGHT 중요 업데이트",
        zh: "PRO INSIGHT 重要更新",
        es: "Actualización PRO INSIGHT",
        pt: "Atualização PRO INSIGHT",
        fr: "Mise à jour PRO INSIGHT",
      }),
      desc: L(lang, {
        ja: "結論が変わったときだけ",
        en: "Only when the conclusion changes",
        ko: "결론이 바뀔 때만",
        zh: "仅在结论变化时",
        es: "Solo cuando cambia la conclusión",
        pt: "Somente quando a conclusão muda",
        fr: "Seulement si la conclusion change",
      }),
    },
    {
      key: "monthlyReport",
      title: L(lang, {
        ja: "月次レポート",
        en: "Monthly report",
        ko: "월간 리포트",
        zh: "月度报告",
        es: "Informe mensual",
        pt: "Relatório mensal",
        fr: "Rapport mensuel",
      }),
      desc: L(lang, {
        ja: "月次レポートが確定したとき",
        en: "When your monthly report is ready",
        ko: "월간 리포트가 준비됐을 때",
        zh: "月度报告就绪时",
        es: "Cuando tu informe mensual esté listo",
        pt: "Quando seu relatório mensal estiver pronto",
        fr: "Quand votre rapport mensuel est prêt",
      }),
    },
  ];
}
