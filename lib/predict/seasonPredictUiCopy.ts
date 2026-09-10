/**
 * シーズン順位 / アワード予想ページ・パネルの UI コピー。
 */
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";

export type SeasonPredictUiLang = LocalizedLang;
export const resolveSeasonPredictUiLang = resolveLocalizedLang;

export function seasonPredictStandingsPageSubtitle(
  lang: SeasonPredictUiLang,
  submitOpen: boolean
): string {
  if (submitOpen) {
    return L(lang, {
      ja: "East / West 各 1〜15 位を予想。同じチームは同じカンファレンス内で一度だけ使えます。",
      en: "Rank East / West 1–15. Each team can be used once per conference.",
      ko: "East / West 각 1–15위를 예측하세요. 같은 팀은 컨퍼런스당 한 번만 사용할 수 있습니다.",
      zh: "预测 East / West 各 1–15 名。同一球队在同一分区只能使用一次。",
      es: "Predice del 1 al 15 en East / West. Cada equipo solo se usa una vez por conferencia.",
      pt: "Preveja East / West de 1 a 15. Cada time só pode ser usado uma vez por conferência.",
      fr: "Classez East / West de 1 à 15. Chaque équipe n’est utilisable qu’une fois par conférence.",
    });
  }
  return L(lang, {
    ja: "締切後の提出集計。チームを押すと順位帯のシェアが見られます。",
    en: "Post-deadline board. Tap a team for rank-band shares.",
    ko: "마감 후 제출 집계. 팀을 누르면 순위 구간 점유율을 볼 수 있습니다.",
    zh: "截止后汇总。点击球队可查看排名区间占比。",
    es: "Tablero tras el cierre. Toca un equipo para ver su reparto por franjas.",
    pt: "Painel pós-prazo. Toque em um time para ver a distribuição por faixas.",
    fr: "Tableau après la date limite. Touchez une équipe pour voir sa répartition par tranches.",
  });
}

export function seasonPredictAwardsPageSubtitle(
  lang: SeasonPredictUiLang,
  submitOpen: boolean
): string {
  if (submitOpen) {
    return L(lang, {
      ja: "MVP・DPOY など主要アワードを予想。候補は人気ピックから選び、名前検索でも絞り込めます。",
      en: "Predict major awards. Pick from popular candidates or search by name.",
      ko: "MVP·DPOY 등 주요 어워드를 예측하세요. 인기 후보에서 고르거나 이름으로 검색할 수 있습니다.",
      zh: "预测 MVP、DPOY 等主要奖项。可从热门候选中选择或按姓名搜索。",
      es: "Predice los premios principales. Elige entre candidatos populares o busca por nombre.",
      pt: "Preveja os principais prêmios. Escolha entre candidatos populares ou busque por nome.",
      fr: "Prédisez les grands trophées. Choisissez parmi les favoris ou recherchez par nom.",
    });
  }
  return L(lang, {
    ja: "締切後の提出集計。各アワードのシェア Top5 です。",
    en: "Post-deadline crowd shares for each award.",
    ko: "마감 후 제출 집계. 각 어워드 Top5 점유율입니다.",
    zh: "截止后汇总。各奖项 Top5 占比。",
    es: "Reparto de votos tras el cierre para cada premio.",
    pt: "Distribuição pós-prazo para cada prêmio.",
    fr: "Répartition des votes après la date limite pour chaque trophée.",
  });
}

export function seasonPredictMarketPendingBody(lang: SeasonPredictUiLang): string {
  return L(lang, {
    ja: "提出期限を過ぎました。集計が完了次第、ここにマーケットが表示されます。",
    en: "The deadline has passed. The market will appear here once aggregation is ready.",
    ko: "제출 기한이 지났습니다. 집계가 완료되면 여기에 마켓이 표시됩니다.",
    zh: "提交期限已过。汇总完成后将在此显示市场数据。",
    es: "El plazo ha terminado. El mercado aparecerá aquí cuando la agregación esté lista.",
    pt: "O prazo passou. O mercado aparecerá aqui quando a agregação estiver pronta.",
    fr: "La date limite est passée. Le marché s’affichera ici une fois l’agrégation prête.",
  });
}

export function seasonPredictStandingsIncompleteError(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "East / West それぞれ 1〜15 位を埋めてから提出してください。",
    en: "Fill ranks 1–15 for both East and West before submitting.",
    ko: "East / West 각각 1–15위를 모두 채운 뒤 제출하세요.",
    zh: "请先填完 East / West 各自的 1–15 名再提交。",
    es: "Completa del 1 al 15 en East y West antes de enviar.",
    pt: "Preencha de 1 a 15 em East e West antes de enviar.",
    fr: "Remplissez les places 1 à 15 pour East et West avant d’envoyer.",
  });
}

export function seasonPredictAwardsIncompleteError(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "7つのアワードすべて選んでから提出してください。",
    en: "Pick a player for all 7 awards before submitting.",
    ko: "7개 어워드를 모두 선택한 뒤 제출하세요.",
    zh: "请先为全部 7 个奖项选择球员再提交。",
    es: "Elige un jugador para los 7 premios antes de enviar.",
    pt: "Escolha um jogador para os 7 prêmios antes de enviar.",
    fr: "Choisissez un joueur pour les 7 trophées avant d’envoyer.",
  });
}

export function seasonPredictInvalidSubmitError(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "提出レスポンスが不正です",
    en: "Invalid submit response",
    ko: "제출 응답이 올바르지 않습니다",
    zh: "提交响应无效",
    es: "Respuesta de envío no válida",
    pt: "Resposta de envio inválida",
    fr: "Réponse d’envoi invalide",
  });
}

export function seasonPredictStandingsBoardHint(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "1–6 ストレートイン / 7–10 プレーイン / 11–15 圏外。採点・Unit・提出期限は右上のはてなを参照。",
    en: "1–6 straight in / 7–10 play-in / 11–15 out. Scoring, Units, and deadline: tap ? above.",
    ko: "1–6 직행 / 7–10 플레이인 / 11–15 탈락. 채점·Unit·마감은 우측 상단 ? 를 참고하세요.",
    zh: "1–6 直接晋级 / 7–10 附加赛 / 11–15 出局。计分、Unit 与截止见右上角 ?。",
    es: "1–6 directo / 7–10 play-in / 11–15 fuera. Puntos, Units y plazo: pulsa ? arriba.",
    pt: "1–6 direto / 7–10 play-in / 11–15 fora. Pontuação, Units e prazo: toque ? acima.",
    fr: "1–6 qualifiés / 7–10 play-in / 11–15 éliminés. Points, Units et date limite : touchez ? en haut.",
  });
}

export function seasonPredictStandingsHowTo(
  lang: SeasonPredictUiLang,
  variant: "mobile" | "web"
): string {
  if (variant === "web") {
    return L(lang, {
      ja: "左が East（シアン）・右が West（アンバー）。順位をタップ → 下にチームスロット。同じ順位をもう一度タップでクリア。",
      en: "Left East (cyan) · right West (amber). Tap a rank → pick a team below. Tap the same rank again to clear.",
      ko: "왼쪽 East(시안)·오른쪽 West(앰버). 순위 탭 → 아래에서 팀 선택. 같은 순위를 다시 탭하면 해제.",
      zh: "左侧 East（青色）· 右侧 West（琥珀色）。点排名 → 在下方选球队。再次点同一排名可清除。",
      es: "Izquierda East (cian) · derecha West (ámbar). Toca un puesto → elige un equipo abajo. Toca de nuevo para borrar.",
      pt: "Esquerda East (ciano) · direita West (âmbar). Toque uma posição → escolha um time abaixo. Toque de novo para limpar.",
      fr: "Gauche East (cyan) · droite West (ambre). Touchez un rang → choisissez une équipe en bas. Retouchez pour effacer.",
    });
  }
  return L(lang, {
    ja: "順位をタップ → 下にチームスロット。配置済みはスロットから消えます。同じ順位をもう一度タップでクリア。",
    en: "Tap a rank → pick a team below. Placed teams leave the tray. Tap the same rank again to clear.",
    ko: "순위 탭 → 아래에서 팀 선택. 배치된 팀은 목록에서 사라집니다. 같은 순위를 다시 탭하면 해제.",
    zh: "点排名 → 在下方选球队。已放置的球队会从列表中移除。再次点同一排名可清除。",
    es: "Toca un puesto → elige un equipo abajo. Los equipos colocados salen de la bandeja. Toca de nuevo para borrar.",
    pt: "Toque uma posição → escolha um time abaixo. Times colocados saem da lista. Toque de novo para limpar.",
    fr: "Touchez un rang → choisissez une équipe en bas. Les équipes placées quittent la liste. Retouchez pour effacer.",
  });
}

export function seasonPredictStandingsTrayEmpty(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "全チーム配置済み",
    en: "All teams placed",
    ko: "모든 팀 배치 완료",
    zh: "所有球队已放置",
    es: "Todos los equipos colocados",
    pt: "Todos os times colocados",
    fr: "Toutes les équipes placées",
  });
}

export function seasonPredictStandingsConfHeading(
  lang: SeasonPredictUiLang,
  isEast: boolean
): string {
  if (isEast) {
    return L(lang, {
      ja: "イースタン · 1–15",
      en: "EASTERN · 1–15",
      ko: "이스턴 · 1–15",
      zh: "东部 · 1–15",
      es: "ESTE · 1–15",
      pt: "LEste · 1–15",
      fr: "EAST · 1–15",
    });
  }
  return L(lang, {
    ja: "ウェスタン · 1–15",
    en: "WESTERN · 1–15",
    ko: "웨스턴 · 1–15",
    zh: "西部 · 1–15",
    es: "OESTE · 1–15",
    pt: "Oeste · 1–15",
    fr: "WEST · 1–15",
  });
}

export function seasonPredictStandingsSlotHint(
  lang: SeasonPredictUiLang,
  selected: boolean
): string {
  if (selected) {
    return L(lang, {
      ja: "下からチームを選ぶ",
      en: "Pick a team below",
      ko: "아래에서 팀 선택",
      zh: "在下方选择球队",
      es: "Elige un equipo abajo",
      pt: "Escolha um time abaixo",
      fr: "Choisissez une équipe en bas",
    });
  }
  return L(lang, {
    ja: "タップして配置",
    en: "Tap to place",
    ko: "탭하여 배치",
    zh: "点击放置",
    es: "Toca para colocar",
    pt: "Toque para colocar",
    fr: "Touchez pour placer",
  });
}

export function seasonPredictStandingsClearHint(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "もう一度タップでクリア",
    en: "Tap again to clear",
    ko: "다시 탭하여 해제",
    zh: "再次点击清除",
    es: "Toca de nuevo para borrar",
    pt: "Toque de novo para limpar",
    fr: "Retouchez pour effacer",
  });
}

export function seasonPredictStandingsMarketHint(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "平均予想の順位表。チームを押すと 1–3 / 4–6 / 7–9 / 10–12 / 13–15 の置き方シェアが出ます。",
    en: "Crowd-average standings. Tap a team for 1–3 / 4–6 / 7–9 / 10–12 / 13–15 placement shares.",
    ko: "평균 예측 순위표. 팀을 누르면 1–3 / 4–6 / 7–9 / 10–12 / 13–15 배치 점유율이 표시됩니다.",
    zh: "平均预测排名。点击球队可查看 1–3 / 4–6 / 7–9 / 10–12 / 13–15 放置占比。",
    es: "Clasificación media. Toca un equipo para ver reparto 1–3 / 4–6 / 7–9 / 10–12 / 13–15.",
    pt: "Classificação média. Toque em um time para ver 1–3 / 4–6 / 7–9 / 10–12 / 13–15.",
    fr: "Classement moyen. Touchez une équipe pour voir 1–3 / 4–6 / 7–9 / 10–12 / 13–15.",
  });
}

export function seasonPredictAwardsPredictHint(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "フォーカス直後は他ユーザー人気ピック約 5 人。入力すると名前の前方一致で候補が出ます。採点・Unit・提出期限は右上のはてなを参照。",
    en: "On focus, ~5 popular picks from other users. Type to filter by name. Scoring, Units, deadline: tap ? above.",
    ko: "포커스 직후 다른 사용자 인기 픽 약 5명. 입력하면 이름 접두 일치로 후보가 나옵니다. 채점·Unit·마감은 ? 참고.",
    zh: "聚焦后显示约 5 名其他用户热门选择。输入姓名前缀筛选。计分、Unit、截止见右上角 ?。",
    es: "Al enfocar, ~5 picks populares. Escribe para filtrar por nombre. Puntos, Units y plazo: pulsa ? arriba.",
    pt: "Ao focar, ~5 picks populares. Digite para filtrar por nome. Pontuação, Units e prazo: toque ? acima.",
    fr: "Au focus, ~5 picks populaires. Saisissez pour filtrer par nom. Points, Units et date limite : touchez ? en haut.",
  });
}

export function seasonPredictAwardsMarketHint(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "各アワードの提出シェア Top5。締切後に公開される本番ビューと同じレイアウトです。",
    en: "Top 5 submission share per award. Same layout as the live post-deadline market.",
    ko: "각 어워드 제출 점유율 Top5. 마감 후 공개되는 본 화면과 동일한 레이아웃입니다.",
    zh: "各奖项提交占比 Top5。与截止后正式视图布局相同。",
    es: "Top 5 de reparto por premio. Mismo diseño que el mercado tras el cierre.",
    pt: "Top 5 de participação por prêmio. Mesmo layout do mercado pós-prazo.",
    fr: "Top 5 de part des votes par trophée. Même mise en page que le marché après la date limite.",
  });
}

export function seasonPredictNudgeCopy(lang: SeasonPredictUiLang): {
  title: string;
  body: string;
  later: string;
  goStandings: string;
} {
  return {
    title: L(lang, {
      ja: "順位予想もしますか？",
      en: "Predict standings too?",
      ko: "순위 예측도 하시겠어요?",
      zh: "也要预测排名吗？",
      es: "¿Predecir también la clasificación?",
      pt: "Prever a classificação também?",
      fr: "Prédire aussi le classement ?",
    }),
    body: L(lang, {
      ja: "アワード予想を提出しました。続けて East / West の順位予想もできます。",
      en: "Awards submitted. You can also rank East / West standings.",
      ko: "어워드 예측을 제출했습니다. East / West 순위 예측도 이어서 할 수 있습니다.",
      zh: "奖项预测已提交。您也可以继续预测 East / West 排名。",
      es: "Premios enviados. También puedes predecir la clasificación East / West.",
      pt: "Prêmios enviados. Você também pode prever East / West.",
      fr: "Trophées envoyés. Vous pouvez aussi prédire East / West.",
    }),
    later: L(lang, {
      ja: "あとで",
      en: "Later",
      ko: "나중에",
      zh: "稍后",
      es: "Más tarde",
      pt: "Depois",
      fr: "Plus tard",
    }),
    goStandings: L(lang, {
      ja: "順位予想へ",
      en: "Go to standings",
      ko: "순위 예측으로",
      zh: "前往排名预测",
      es: "Ir a clasificación",
      pt: "Ir para classificação",
      fr: "Aller au classement",
    }),
  };
}

export function seasonPredictStandingsBandLabel(
  lang: SeasonPredictUiLang,
  band: { label: UiStrings }
): string {
  return L(lang, band.label);
}

export function seasonPredictPredictedRankBandsHeading(
  lang: SeasonPredictUiLang
): string {
  return L(lang, {
    ja: "予想順位帯",
    en: "Predicted rank bands",
    ko: "예상 순위 구간",
    zh: "预测排名区间",
    es: "Franjas de puesto previstas",
    pt: "Faixas de colocação previstas",
    fr: "Tranches de rang prédites",
  });
}

export function seasonPredictAlertCopy(lang: SeasonPredictUiLang) {
  return {
    deadlinePassedTitle: L(lang, {
      ja: "提出期限終了",
      en: "Deadline passed",
      ko: "제출 기한 종료",
      zh: "提交已截止",
      es: "Plazo cerrado",
      pt: "Prazo encerrado",
      fr: "Date limite passée",
    }),
    incompleteTitle: L(lang, {
      ja: "未入力があります",
      en: "Incomplete",
      ko: "미입력 항목이 있습니다",
      zh: "尚有未填项",
      es: "Incompleto",
      pt: "Incompleto",
      fr: "Incomplet",
    }),
    submitFailedTitle: L(lang, {
      ja: "提出に失敗しました",
      en: "Submit failed",
      ko: "제출에 실패했습니다",
      zh: "提交失败",
      es: "Error al enviar",
      pt: "Falha ao enviar",
      fr: "Échec de l’envoi",
    }),
    submittedTitle: L(lang, {
      ja: "提出しました",
      en: "Submitted",
      ko: "제출했습니다",
      zh: "已提交",
      es: "Enviado",
      pt: "Enviado",
      fr: "Envoyé",
    }),
    standingsSavedBody: L(lang, {
      ja: "順位予想を保存しました。",
      en: "Standings prediction saved.",
      ko: "순위 예측을 저장했습니다.",
      zh: "排名预测已保存。",
      es: "Predicción de clasificación guardada.",
      pt: "Previsão de classificação salva.",
      fr: "Prédiction de classement enregistrée.",
    }),
  };
}

/** ページ共通 UI（standings / awards） */
export function seasonPredictPageUiCopy(lang: SeasonPredictUiLang) {
  return {
    deadlineLabel: L(lang, {
      ja: "提出期限",
      en: "Deadline",
      ko: "제출 기한",
      zh: "提交截止",
      es: "Plazo",
      pt: "Prazo",
      fr: "Date limite",
    }),
    marketPassed: L(lang, {
      ja: "締切後 · マーケット",
      en: "Deadline passed · crowd market",
      ko: "마감 후 · 마켓",
      zh: "已截止 · 市场",
      es: "Plazo cerrado · mercado",
      pt: "Prazo encerrado · mercado",
      fr: "Date limite passée · marché",
    }),
    marketPending: L(lang, {
      ja: "マーケット準備中",
      en: "Market pending",
      ko: "마켓 준비 중",
      zh: "市场准备中",
      es: "Mercado pendiente",
      pt: "Mercado pendente",
      fr: "Marché en attente",
    }),
    editResubmit: L(lang, {
      ja: "編集して再提出",
      en: "Edit & resubmit",
      ko: "수정 후 재제출",
      zh: "编辑并重新提交",
      es: "Editar y reenviar",
      pt: "Editar e reenviar",
      fr: "Modifier et renvoyer",
    }),
    submitting: L(lang, {
      ja: "提出中…",
      en: "Submitting…",
      ko: "제출 중…",
      zh: "提交中…",
      es: "Enviando…",
      pt: "Enviando…",
      fr: "Envoi…",
    }),
    rulesTitle: L(lang, {
      ja: "採点ルール",
      en: "How points are scored",
      ko: "채점 규칙",
      zh: "计分规则",
      es: "Reglas de puntuación",
      pt: "Regras de pontuação",
      fr: "Règles de score",
    }),
    rulesAria: L(lang, {
      ja: "採点ルール",
      en: "Scoring rules",
      ko: "채점 규칙",
      zh: "计分规则",
      es: "Reglas de puntuación",
      pt: "Regras de pontuação",
      fr: "Règles de score",
    }),
    close: L(lang, {
      ja: "閉じる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
    }),
    submitPrediction: L(lang, {
      ja: "予想を提出",
      en: "Submit prediction",
      ko: "예측 제출",
      zh: "提交预测",
      es: "Enviar predicción",
      pt: "Enviar previsão",
      fr: "Envoyer la prédiction",
    }),
  };
}
