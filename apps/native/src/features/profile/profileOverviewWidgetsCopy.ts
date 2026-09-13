/**
 * Overview 系ウィジェット（Streak / Result Drop / Summary / Affinity / PrevMonth / Mark / Bracket / Stats）7言語。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "../../../../../lib/i18n/localize";
import { profileAwardsBracketCopy } from "../../../../../lib/profile/profileAwardsBracketCopy";

export type ProfileOverviewWidgetsLang = LocalizedLang;
export const resolveProfileOverviewWidgetsLang = resolveLocalizedLang;

export function profileStreakTrackerCopy(
  language: string | null | undefined,
  lastN: number
) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    subtitle: L(lang, {
      ja: `直近${lastN}試合の連勝・連敗を表示`,
      en: `Win/loss streaks from your last ${lastN} settled picks`,
      ko: `최근 ${lastN}경기 연승·연패`,
      zh: `显示最近 ${lastN} 场连胜/连败`,
      es: `Rachas de tus últimos ${lastN} picks cerrados`,
      pt: `Sequências dos últimos ${lastN} palpites fechados`,
      fr: `Séries sur vos ${lastN} derniers picks validés`,
    }),
    winStreakCaption: L(lang, {
      ja: "連勝中",
      en: "Win streak",
      ko: "연승 중",
      zh: "连胜中",
      es: "Racha de victorias",
      pt: "Sequência de vitórias",
      fr: "Série de victoires",
    }),
    lossStreakCaption: L(lang, {
      ja: "連敗中",
      en: "Loss streak",
      ko: "연패 중",
      zh: "连败中",
      es: "Racha de derrotas",
      pt: "Sequência de derrotas",
      fr: "Série de défaites",
    }),
    flatCaption: L(lang, {
      ja: "直近",
      en: "Last pick",
      ko: "최근",
      zh: "最近",
      es: "Último pick",
      pt: "Último palpite",
      fr: "Dernier pick",
    }),
    statWinLabel: L(lang, {
      ja: "最高連勝",
      en: "Best W streak",
      ko: "최장 연승",
      zh: "最长连胜",
      es: "Mejor racha W",
      pt: "Melhor sequência W",
      fr: "Meilleure série V",
    }),
    statLossLabel: L(lang, {
      ja: "最高連敗",
      en: "Best L streak",
      ko: "최장 연패",
      zh: "最长连败",
      es: "Mejor racha L",
      pt: "Melhor sequência L",
      fr: "Meilleure série D",
    }),
    statRecordLabel: L(lang, {
      ja: `直近${lastN}試合の成績`,
      en: `Last ${lastN} games`,
      ko: `최근 ${lastN}경기 성적`,
      zh: `最近 ${lastN} 场战绩`,
      es: `Últimos ${lastN} partidos`,
      pt: `Últimos ${lastN} jogos`,
      fr: `${lastN} derniers matchs`,
    }),
    loadError: L(lang, {
      ja: "データが取れません",
      en: "Couldn't load data",
      ko: "데이터를 불러올 수 없습니다",
      zh: "无法加载数据",
      es: "No se pudieron cargar los datos",
      pt: "Não foi possível carregar os dados",
      fr: "Impossible de charger les données",
    }),
    empty: L(lang, {
      ja: "確定済みの予想がありません",
      en: "No settled predictions",
      ko: "확정된 예상이 없습니다",
      zh: "暂无已结算的预测",
      es: "Sin predicciones cerradas",
      pt: "Sem palpites fechados",
      fr: "Aucune prédiction validée",
    }),
  };
}

export function profileSettledTodayCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    subtitle: L(lang, {
      ja: "今日確定した分析一覧",
      en: "Today's finalized analyses",
      ko: "오늘 확정된 분석",
      zh: "今日已结算的分析",
      es: "Análisis finalizados de hoy",
      pt: "Análises finalizadas de hoje",
      fr: "Analyses finalisées aujourd’hui",
    }),
    empty: L(lang, {
      ja: "今日確定した分析はまだありません",
      en: "No analyses finalized today yet",
      ko: "오늘 확정된 분석이 아직 없습니다",
      zh: "今天还没有已结算的分析",
      es: "Aún no hay análisis finalizados hoy",
      pt: "Ainda não há análises finalizadas hoje",
      fr: "Aucune analyse finalisée aujourd’hui",
    }),
    designPreview: L(lang, {
      ja: "デザインプレビュー（本日確定なし）",
      en: "Design preview (none settled today)",
      ko: "디자인 미리보기（오늘 확정 없음）",
      zh: "设计预览（今日无结算）",
      es: "Vista previa de diseño (sin cierres hoy)",
      pt: "Prévia de design (nenhum fechado hoje)",
      fr: "Aperçu design (aucun validé aujourd’hui)",
    }),
  };
}

export function profileSummaryGridCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    posts: L(lang, {
      ja: "投稿数",
      en: "Posts",
      ko: "게시 수",
      zh: "帖子数",
      es: "Posts",
      pt: "Posts",
      fr: "Posts",
    }),
    winRate: L(lang, {
      ja: "勝率",
      en: "Win rate",
      ko: "승률",
      zh: "胜率",
      es: "Win rate",
      pt: "Taxa de acerto",
      fr: "Taux de victoire",
    }),
    upset: L(lang, {
      ja: "アップセット得点",
      en: "Upset pts",
      ko: "업셋 점수",
      zh: "冷门得分",
      es: "Upset pts",
      pt: "Pts upset",
      fr: "Pts upset",
    }),
    streak: L(lang, {
      ja: "最大連勝",
      en: "Max win streak",
      ko: "최장 연승",
      zh: "最长连胜",
      es: "Máx. racha",
      pt: "Máx. sequência",
      fr: "Série max",
    }),
    total: L(lang, {
      ja: "総合得点",
      en: "Total pts",
      ko: "총점",
      zh: "总分",
      es: "Total pts",
      pt: "Total pts",
      fr: "Total pts",
    }),
    rankSuffix: (rank: number, ordinalEn: string) =>
      L(lang, {
        ja: ` / ${rank}位`,
        en: ` / ${ordinalEn}`,
        ko: ` / ${rank}위`,
        zh: ` / 第${rank}名`,
        es: ` / ${ordinalEn}`,
        pt: ` / ${ordinalEn}`,
        fr: ` / ${ordinalEn}`,
      }),
  };
}

export function profileTeamAffinityCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    title: L(lang, {
      ja: "チーム別パフォーマンス",
      en: "Team performance",
      ko: "팀별 성과",
      zh: "按球队表现",
      es: "Rendimiento por equipo",
      pt: "Desempenho por time",
      fr: "Performance par équipe",
    }),
    strong: L(lang, {
      ja: "相性の良いチーム",
      en: "Strong matchups",
      ko: "강한 매치업",
      zh: "相性好的球队",
      es: "Emparejamientos fuertes",
      pt: "Confrontos fortes",
      fr: "Matchups favorables",
    }),
    weak: L(lang, {
      ja: "相性の悪いチーム",
      en: "Weak matchups",
      ko: "약한 매치업",
      zh: "相性差的球队",
      es: "Emparejamientos débiles",
      pt: "Confrontos fracos",
      fr: "Matchups défavorables",
    }),
    notEnough: L(lang, {
      ja: "データ不足",
      en: "Not enough data",
      ko: "데이터 부족",
      zh: "数据不足",
      es: "Datos insuficientes",
      pt: "Dados insuficientes",
      fr: "Données insuffisantes",
    }),
    needFive: L(lang, {
      ja: "各チーム最低5投稿が必要です",
      en: "At least 5 posts per team required",
      ko: "팀당 최소 5개 게시 필요",
      zh: "每队至少需要 5 条帖子",
      es: "Se requieren al menos 5 posts por equipo",
      pt: "São necessários pelo menos 5 posts por time",
      fr: "Au moins 5 posts par équipe requis",
    }),
    games: (n: number) =>
      L(lang, {
        ja: `${n}試合`,
        en: `${n} games`,
        ko: `${n}경기`,
        zh: `${n} 场`,
        es: `${n} partidos`,
        pt: `${n} jogos`,
        fr: `${n} matchs`,
      }),
    hint: (rate: number) => {
      if (rate >= 70) {
        return L(lang, {
          ja: "安定して勝てている",
          en: "Consistently strong",
          ko: "꾸준히 강함",
          zh: "稳定强势",
          es: "Consistentemente fuerte",
          pt: "Consistentemente forte",
          fr: "Régulièrement fort",
        });
      }
      if (rate >= 55) {
        return L(lang, {
          ja: "やや相性が良い",
          en: "Slightly favorable",
          ko: "다소 유리",
          zh: "略有优势",
          es: "Ligeramente favorable",
          pt: "Ligeiramente favorável",
          fr: "Légèrement favorable",
        });
      }
      if (rate >= 45) {
        return L(lang, {
          ja: "五分の相性",
          en: "Even matchup",
          ko: "팽팽한 매치업",
          zh: "势均力敌",
          es: "Emparejamiento parejo",
          pt: "Confronto equilibrado",
          fr: "Matchup équilibré",
        });
      }
      return L(lang, {
        ja: "相性が悪い",
        en: "Unfavorable",
        ko: "불리함",
        zh: "相性不佳",
        es: "Desfavorable",
        pt: "Desfavorável",
        fr: "Défavorable",
      });
    },
  };
}

export function profilePrevMonthSummaryCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    summaryTitle: (monthKey: string) =>
      L(lang, {
        ja: `${monthKey} サマリー`,
        en: `${monthKey} summary`,
        ko: `${monthKey} 요약`,
        zh: `${monthKey} 摘要`,
        es: `Resumen ${monthKey}`,
        pt: `Resumo ${monthKey}`,
        fr: `Résumé ${monthKey}`,
      }),
    noPosts: L(lang, {
      ja: "投稿がありません",
      en: "No posts this month",
      ko: "이번 달 게시가 없습니다",
      zh: "本月没有帖子",
      es: "Sin posts este mes",
      pt: "Sem posts este mês",
      fr: "Aucun post ce mois-ci",
    }),
    rank: (rank: number) =>
      L(lang, {
        ja: `${rank}位`,
        en: `#${rank}`,
        ko: `${rank}위`,
        zh: `第${rank}名`,
        es: `#${rank}`,
        pt: `#${rank}`,
        fr: `#${rank}`,
      }),
    totalPoints: L(lang, {
      ja: "総合得点",
      en: "Total points",
      ko: "총점",
      zh: "总分",
      es: "Puntos totales",
      pt: "Pontos totais",
      fr: "Points totaux",
    }),
    mom: L(lang, {
      ja: "先月比",
      en: "MoM",
      ko: "전월 대비",
      zh: "环比",
      es: "MoM",
      pt: "MoM",
      fr: "MoM",
    }),
    benchHint: L(lang, {
      ja: "タップで母集団の基準を表示",
      en: "Tap for cohort benchmarks",
      ko: "탭하여 모집단 기준 표시",
      zh: "点按显示群体基准",
      es: "Toca para ver benchmarks",
      pt: "Toque para ver benchmarks",
      fr: "Touchez pour les benchmarks",
    }),
    userAvg: L(lang, {
      ja: "ユーザー平均",
      en: "User avg",
      ko: "사용자 평균",
      zh: "用户平均",
      es: "Media usuarios",
      pt: "Média usuários",
      fr: "Moy. utilisateurs",
    }),
    median: L(lang, {
      ja: "中央値",
      en: "Median",
      ko: "중앙값",
      zh: "中位数",
      es: "Mediana",
      pt: "Mediana",
      fr: "Médiane",
    }),
    top10: L(lang, {
      ja: "Top10境界",
      en: "Top 10% line",
      ko: "Top10 경계",
      zh: "Top10% 线",
      es: "Línea Top 10%",
      pt: "Linha Top 10%",
      fr: "Ligne Top 10%",
    }),
    first: L(lang, {
      ja: "1位",
      en: "1st",
      ko: "1위",
      zh: "第1名",
      es: "1.º",
      pt: "1.º",
      fr: "1er",
    }),
    base: L(lang, {
      ja: "基本点",
      en: "Base",
      ko: "기본점",
      zh: "基础分",
      es: "Base",
      pt: "Base",
      fr: "Base",
    }),
    streak: L(lang, {
      ja: "連勝ボーナス",
      en: "Streak",
      ko: "연승 보너스",
      zh: "连胜加成",
      es: "Racha",
      pt: "Sequência",
      fr: "Série",
    }),
    upset: L(lang, {
      ja: "アップセット",
      en: "Upset",
      ko: "업셋",
      zh: "冷门",
      es: "Upset",
      pt: "Upset",
      fr: "Upset",
    }),
    posts: L(lang, {
      ja: "投稿",
      en: "Posts",
      ko: "게시",
      zh: "帖子",
      es: "Posts",
      pt: "Posts",
      fr: "Posts",
    }),
    winRate: L(lang, {
      ja: "勝率",
      en: "Win rate",
      ko: "승률",
      zh: "胜率",
      es: "Win rate",
      pt: "Taxa de acerto",
      fr: "Taux de victoire",
    }),
    upsetHits: L(lang, {
      ja: "upset的中数",
      en: "Upset hits",
      ko: "업셋 적중",
      zh: "冷门命中",
      es: "Aciertos upset",
      pt: "Acertos upset",
      fr: "Hits upset",
    }),
    upsetPoints: L(lang, {
      ja: "upset得点合計",
      en: "Upset points",
      ko: "업셋 점수 합계",
      zh: "冷门得分合计",
      es: "Puntos upset",
      pt: "Pontos upset",
      fr: "Points upset",
    }),
    byLeague: L(lang, {
      ja: "リーグ別投稿",
      en: "Posts by league",
      ko: "리그별 게시",
      zh: "按联赛帖子",
      es: "Posts por liga",
      pt: "Posts por liga",
      fr: "Posts par ligue",
    }),
  };
}

export function profileMarkListCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    back: L(lang, {
      ja: "戻る",
      en: "Back",
      ko: "뒤로",
      zh: "返回",
      es: "Atrás",
      pt: "Voltar",
      fr: "Retour",
    }),
    sub: (marked: number, max: number, by: number) =>
      L(lang, {
        ja: `マーク中 ${marked}/${max} · マークされた数 ${by}`,
        en: `Marked ${marked}/${max} · marked by ${by}`,
        ko: `마크 ${marked}/${max} · 마크됨 ${by}`,
        zh: `标记中 ${marked}/${max} · 被标记 ${by}`,
        es: `Marcados ${marked}/${max} · marcados por ${by}`,
        pt: `Marcados ${marked}/${max} · marcados por ${by}`,
        fr: `Marqués ${marked}/${max} · marqué par ${by}`,
      }),
    empty: L(lang, {
      ja: "他の予想者を MARK するとここに並びます",
      en: "MARK other predictors to see them here",
      ko: "다른 예상자를 MARK하면 여기에 표시됩니다",
      zh: "标记其他预测者后会显示在这里",
      es: "MARCA a otros predictores para verlos aquí",
      pt: "MARQUE outros previsores para vê-los aqui",
      fr: "MARQUEZ d’autres prédicteurs pour les voir ici",
    }),
    weekly: L(lang, {
      ja: "今週の順位",
      en: "WEEKLY",
      ko: "이번 주 순위",
      zh: "本周排名",
      es: "SEMANAL",
      pt: "SEMANAL",
      fr: "HEBDO",
    }),
    loadingWeekly: L(lang, {
      ja: "今週の成績を読み込み中…",
      en: "Loading weekly stats…",
      ko: "주간 성적 불러오는 중…",
      zh: "正在加载本周成绩…",
      es: "Cargando stats semanales…",
      pt: "Carregando stats semanais…",
      fr: "Chargement des stats hebdo…",
    }),
    unmark: L(lang, {
      ja: "マークを外す",
      en: "Unmark",
      ko: "마크 해제",
      zh: "取消标记",
      es: "Quitar marca",
      pt: "Desmarcar",
      fr: "Retirer la marque",
    }),
  };
}

export function profileBracketTabCopy(language: string | null | undefined) {
  const shared = profileAwardsBracketCopy(language);
  return {
    signIn: shared.signInRequired,
    noBracket: shared.noPlayoffBracket,
  };
}

export function profileStatsTabCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    signIn: L(lang, {
      ja: "ログインが必要です",
      en: "Sign in required",
      ko: "로그인이 필요합니다",
      zh: "需要登录",
      es: "Inicia sesión",
      pt: "Faça login",
      fr: "Connexion requise",
    }),
  };
}

export function profileCareerPanelCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    title: "CAREER",
    sheetTitle: "CAREER // SHEET",
    desc: L(lang, {
      ja: "予想者としての履歴書。長期成績は信頼の証明になる。",
      en: "Your résumé as a predictor. Long-term records build trust.",
      ko: "예상자로서의 이력서. 장기 성적이 신뢰를 만듭니다.",
      zh: "作为预测者的履历。长期成绩建立信任。",
      es: "Tu currículum como predictor. El historial genera confianza.",
      pt: "Seu currículo como previsor. O histórico gera confiança.",
      fr: "Votre CV de prédicteur. Le long terme inspire confiance.",
    }),
    awards: "Awards",
    seasonAllTime: "All-Time",
    dossier: "PREDICTOR DOSSIER",
    prevBoard: L(lang, {
      ja: "前の統計ボード",
      en: "Previous stats board",
      ko: "이전 통계 보드",
      zh: "上一统计板",
      es: "Tablero anterior",
      pt: "Painel anterior",
      fr: "Tableau précédent",
    }),
    switchBoard: L(lang, {
      ja: "CAREER / SEASON / PLAYOFF を切り替え",
      en: "Switch Career / Season / Playoff",
      ko: "CAREER / SEASON / PLAYOFF 전환",
      zh: "切换 CAREER / SEASON / PLAYOFF",
      es: "Cambiar Career / Season / Playoff",
      pt: "Alternar Career / Season / Playoff",
      fr: "Basculer Career / Season / Playoff",
    }),
    nextBoard: L(lang, {
      ja: "次の統計ボード",
      en: "Next stats board",
      ko: "다음 통계 보드",
      zh: "下一统计板",
      es: "Tablero siguiente",
      pt: "Painel seguinte",
      fr: "Tableau suivant",
    }),
    loadError: L(lang, {
      ja: "CAREER を取得できませんでした",
      en: "Couldn’t load CAREER",
      ko: "CAREER를 불러올 수 없습니다",
      zh: "无法加载 CAREER",
      es: "No se pudo cargar CAREER",
      pt: "Não foi possível carregar CAREER",
      fr: "Impossible de charger CAREER",
    }),
    empty: L(lang, {
      ja: "CAREER データがまだありません",
      en: "No CAREER data yet",
      ko: "CAREER 데이터가 아직 없습니다",
      zh: "暂无 CAREER 数据",
      es: "Aún no hay datos CAREER",
      pt: "Ainda sem dados CAREER",
      fr: "Pas encore de données CAREER",
    }),
  };
}

export function profileReportChromeCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    consensus: L(lang, {
      ja: "順当",
      en: "CONSENSUS",
      ko: "순당",
      zh: "顺当",
      es: "CONSENSUS",
      pt: "CONSENSUS",
      fr: "CONSENSUS",
    }),
    fade: L(lang, {
      ja: "逆張り",
      en: "FADE",
      ko: "역배",
      zh: "逆势",
      es: "FADE",
      pt: "FADE",
      fr: "FADE",
    }),
    prevWeek: L(lang, {
      ja: "前の週",
      en: "Previous week",
      ko: "이전 주",
      zh: "上一周",
      es: "Semana anterior",
      pt: "Semana anterior",
      fr: "Semaine précédente",
    }),
    nextWeek: L(lang, {
      ja: "次の週",
      en: "Next week",
      ko: "다음 주",
      zh: "下一周",
      es: "Semana siguiente",
      pt: "Próxima semana",
      fr: "Semaine suivante",
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
    weekly: L(lang, {
      ja: "週間",
      en: "Weekly",
      ko: "주간",
      zh: "周报",
      es: "Semanal",
      pt: "Semanal",
      fr: "Hebdo",
    }),
    monthly: L(lang, {
      ja: "月間",
      en: "Monthly",
      ko: "월간",
      zh: "月报",
      es: "Mensual",
      pt: "Mensal",
      fr: "Mensuel",
    }),
    weeklyTitle: "WEEKLY REPORT",
    monthlyTitle: "MONTHLY REPORT",
    divisions: L(lang, {
      ja: "部門成績",
      en: "Divisions",
      ko: "부문 성적",
      zh: "分项成绩",
      es: "Divisiones",
      pt: "Divisões",
      fr: "Divisions",
    }),
    battleSection: L(lang, {
      ja: "順位変動",
      en: "Rank Moves",
      ko: "순위 변동",
      zh: "排名变动",
      es: "Movimientos",
      pt: "Movimentos",
      fr: "Mouvements",
    }),
    overtaken: L(lang, {
      ja: "抜いた相手",
      en: "Passed",
      ko: "앞지른 상대",
      zh: "超越的对手",
      es: "Superados",
      pt: "Ultrapassados",
      fr: "Dépassés",
    }),
    overtakenBy: L(lang, {
      ja: "抜かれた相手",
      en: "Passed by",
      ko: "앞지른 당한 상대",
      zh: "被超越的对手",
      es: "Superado por",
      pt: "Ultrapassado por",
      fr: "Dépassé par",
    }),
    nextTarget: L(lang, {
      ja: "次のターゲット",
      en: "Next Target",
      ko: "다음 타깃",
      zh: "下一个目标",
      es: "Siguiente objetivo",
      pt: "Próximo alvo",
      fr: "Prochaine cible",
    }),
    threat: L(lang, {
      ja: "背後の脅威",
      en: "Closing In",
      ko: "뒤의 위협",
      zh: "身后威胁",
      es: "Amenaza detrás",
      pt: "Ameaça atrás",
      fr: "Menace derrière",
    }),
    thisMonth: L(lang, {
      ja: "今月の結果",
      en: "This Month",
      ko: "이번 달 결과",
      zh: "本月结果",
      es: "Este mes",
      pt: "Este mês",
      fr: "Ce mois",
    }),
    numbers: L(lang, {
      ja: "数字で見る今月",
      en: "Month in Numbers",
      ko: "숫자로 보는 이번 달",
      zh: "数字看本月",
      es: "Mes en números",
      pt: "Mês em números",
      fr: "Mois en chiffres",
    }),
    unitsBreakdown: L(lang, {
      ja: "獲得 Unit 内訳",
      en: "Units Breakdown",
      ko: "획득 Unit 내역",
      zh: "Unit 明细",
      es: "Desglose de Units",
      pt: "Detalhe de Units",
      fr: "Détail des Units",
    }),
    radar: L(lang, {
      ja: "能力チャート",
      en: "Ability Chart",
      ko: "능력 차트",
      zh: "能力图",
      es: "Gráfico de habilidad",
      pt: "Gráfico de habilidade",
      fr: "Graphique d’aptitude",
    }),
    habits: L(lang, {
      ja: "予想のクセ",
      en: "Habits",
      ko: "예상 습관",
      zh: "预测习惯",
      es: "Hábitos",
      pt: "Hábitos",
      fr: "Habitudes",
    }),
    affinity: L(lang, {
      ja: "チーム相性",
      en: "Team Affinity",
      ko: "팀 궁합",
      zh: "球队契合",
      es: "Afinidad",
      pt: "Afinidade",
      fr: "Affinité",
    }),
    highlights: L(lang, {
      ja: "月間ハイライト",
      en: "Highlights",
      ko: "월간 하이라이트",
      zh: "月度亮点",
      es: "Destacados",
      pt: "Destaques",
      fr: "Temps forts",
    }),
    outlook: L(lang, {
      ja: "今月のサマリー",
      en: "Month Summary",
      ko: "이번 달 요약",
      zh: "本月摘要",
      es: "Resumen del mes",
      pt: "Resumo do mês",
      fr: "Résumé du mois",
    }),
  };
}
