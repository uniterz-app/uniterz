/**
 * NBA リーグ表 / 検索 / HowTheyPlay / Live / Standings / Playoff chrome（7言語）
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";

export type NbaStatsChromeLang = LocalizedLang;
export const resolveNbaStatsChromeLang = resolveLocalizedLang;

/** カタログ側の 7言語 hint / label を現在言語で解決 */
export function nbaLocalizedText(
  lang: LocalizedLang,
  text: UiStrings | null | undefined
): string {
  return text ? L(lang, text) : "";
}

export function nbaLeagueStatsChrome(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    playerCol: L(lang, {
      ja: "選手",
      en: "Player",
      ko: "선수",
      zh: "球员",
      es: "Jugador",
      pt: "Jogador",
      fr: "Joueur",
    }),
    teamCol: L(lang, {
      ja: "チーム",
      en: "Team",
      ko: "팀",
      zh: "球队",
      es: "Equipo",
      pt: "Time",
      fr: "Équipe",
    }),
    sortDesc: L(lang, {
      ja: "降順",
      en: "hi→lo",
      ko: "내림차순",
      zh: "降序",
      es: "hi→lo",
      pt: "hi→lo",
      fr: "hi→lo",
    }),
    sortAsc: L(lang, {
      ja: "昇順",
      en: "lo→hi",
      ko: "오름차순",
      zh: "升序",
      es: "lo→hi",
      pt: "lo→hi",
      fr: "lo→hi",
    }),
    sortA11yDesc: L(lang, {
      ja: "降順。タップで昇順",
      en: "Descending. Tap for ascending",
      ko: "내림차순. 탭하면 오름차순",
      zh: "降序。点按切换升序",
      es: "Descendente. Toca para ascendente",
      pt: "Decrescente. Toque para crescente",
      fr: "Décroissant. Touchez pour croissant",
    }),
    sortA11yAsc: L(lang, {
      ja: "昇順。タップで降順",
      en: "Ascending. Tap for descending",
      ko: "오름차순. 탭하면 내림차순",
      zh: "升序。点按切换降序",
      es: "Ascendente. Toca para descendente",
      pt: "Crescente. Toque para decrescente",
      fr: "Croissant. Touchez pour décroissant",
    }),
    loadFailed: (error: string) =>
      L(lang, {
        ja: `読み込み失敗（${error}）`,
        en: `Failed to load (${error})`,
        ko: `불러오기 실패 (${error})`,
        zh: `加载失败（${error}）`,
        es: `Error al cargar (${error})`,
        pt: `Falha ao carregar (${error})`,
        fr: `Échec du chargement (${error})`,
      }),
    standingsWl: L(lang, {
      ja: "成績",
      en: "W-L",
      ko: "승패",
      zh: "胜负",
      es: "W-L",
      pt: "W-L",
      fr: "V-D",
    }),
    standingsStreak: L(lang, {
      ja: "連勝",
      en: "STRK",
      ko: "연승",
      zh: "连胜",
      es: "RACHA",
      pt: "SEQ",
      fr: "SÉRIE",
    }),
  };
}

export function nbaStatsSearchCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    placeholderTeam: L(lang, {
      ja: "チームを検索（Lakers / LAL）",
      en: "Search teams (Lakers / LAL)",
      ko: "팀 검색 (Lakers / LAL)",
      zh: "搜索球队（Lakers / LAL）",
      es: "Buscar equipos (Lakers / LAL)",
      pt: "Buscar times (Lakers / LAL)",
      fr: "Rechercher équipes (Lakers / LAL)",
    }),
    placeholderPlayer: L(lang, {
      ja: "選手を検索（Luka / Curry）",
      en: "Search players (Luka / Curry)",
      ko: "선수 검색 (Luka / Curry)",
      zh: "搜索球员（Luka / Curry）",
      es: "Buscar jugadores (Luka / Curry)",
      pt: "Buscar jogadores (Luka / Curry)",
      fr: "Rechercher joueurs (Luka / Curry)",
    }),
    noMatches: L(lang, {
      ja: "該当なし",
      en: "NO MATCHES",
      ko: "결과 없음",
      zh: "无匹配",
      es: "SIN COINCIDENCIAS",
      pt: "SEM RESULTADOS",
      fr: "AUCUNE CORRESPONDANCE",
    }),
  };
}

export function nbaHowTheyPlayChrome(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    us: L(lang, {
      ja: "自分",
      en: "US",
      ko: "우리",
      zh: "本队",
      es: "NOS",
      pt: "NÓS",
      fr: "NOUS",
    }),
    them: L(lang, {
      ja: "相手",
      en: "THEM",
      ko: "상대",
      zh: "对手",
      es: "ELLOS",
      pt: "ELES",
      fr: "EUX",
    }),
    noData: L(lang, {
      ja: "データがありません",
      en: "No data yet",
      ko: "데이터가 없습니다",
      zh: "暂无数据",
      es: "Sin datos aún",
      pt: "Sem dados ainda",
      fr: "Pas encore de données",
    }),
  };
}

export function liveGameStatsPreviewCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    tapToOpen: L(lang, {
      ja: "タップでスタッツを開く",
      en: "Tap to open stats",
      ko: "탭하여 스탯 열기",
      zh: "点按打开数据",
      es: "Toca para abrir stats",
      pt: "Toque para abrir stats",
      fr: "Touchez pour ouvrir les stats",
    }),
    subtitle: L(lang, {
      ja: "試合カード → チームスタッツ + ボックススコア。データは mock。",
      en: "Match card → Team stats + Box score. Mock data.",
      ko: "경기 카드 → 팀 스탯 + 박스스코어. 목 데이터.",
      zh: "比赛卡片 → 球队数据 + 技术统计。模拟数据。",
      es: "Tarjeta → Stats de equipo + Box score. Datos mock.",
      pt: "Cartão → Stats do time + Box score. Dados mock.",
      fr: "Carte → Stats d’équipe + Box score. Données mock.",
    }),
    loading: L(lang, {
      ja: "スタッツを読み込み中…",
      en: "Loading stats…",
      ko: "스탯 불러오는 중…",
      zh: "正在加载数据…",
      es: "Cargando stats…",
      pt: "Carregando stats…",
      fr: "Chargement des stats…",
    }),
    unavailable: L(lang, {
      ja: "試合スタッツはまだありません",
      en: "Game stats not available yet",
      ko: "경기 스탯이 아직 없습니다",
      zh: "比赛数据尚不可用",
      es: "Stats del partido aún no disponibles",
      pt: "Stats do jogo ainda indisponíveis",
      fr: "Stats du match pas encore disponibles",
    }),
  };
}

export function playoffBracketViewCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    subtitle: L(lang, {
      ja: "提出済みのプレーオフブラケット。的中状況は公式結果と照合して表示されます。",
      en: "Your submitted playoff bracket. Hits are checked against official results.",
      ko: "제출한 플레이오프 브래킷. 적중은 공식 결과와 대조됩니다.",
      zh: "已提交的季后赛对阵。命中对照官方结果。",
      es: "Tu bracket de playoffs enviado. Los aciertos se contrastan con resultados oficiales.",
      pt: "Seu bracket de playoffs enviado. Acertos conferidos com resultados oficiais.",
      fr: "Votre bracket playoffs soumis. Les hits sont vérifiés vs résultats officiels.",
    }),
    market: L(lang, {
      ja: "マーケット",
      en: "Market",
      ko: "마켓",
      zh: "市场",
      es: "Mercado",
      pt: "Mercado",
      fr: "Marché",
    }),
    predict: L(lang, {
      ja: "予想する",
      en: "Predict",
      ko: "예상하기",
      zh: "预测",
      es: "Predecir",
      pt: "Prever",
      fr: "Prédire",
    }),
    signInRequired: L(lang, {
      ja: "ログインが必要です",
      en: "Sign in required",
      ko: "로그인이 필요합니다",
      zh: "需要登录",
      es: "Inicio de sesión requerido",
      pt: "Login necessário",
      fr: "Connexion requise",
    }),
    noBracket: L(lang, {
      ja: "提出済みのプレーオフブラケットがありません",
      en: "No playoff bracket submitted yet",
      ko: "제출된 플레이오프 브래킷이 없습니다",
      zh: "尚未提交季后赛对阵",
      es: "Aún no hay bracket de playoffs enviado",
      pt: "Nenhum bracket de playoffs enviado ainda",
      fr: "Aucun bracket playoffs soumis pour l’instant",
    }),
    predictCta: L(lang, {
      ja: "ブラケットを予想する",
      en: "Predict the bracket",
      ko: "브래킷 예상하기",
      zh: "预测对阵",
      es: "Predecir el bracket",
      pt: "Prever o bracket",
      fr: "Prédire le bracket",
    }),
  };
}

export function playoffBracketHitLegendCopy(
  language: string | null | undefined,
  compact?: boolean
) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    winnerOnly: compact
      ? L(lang, {
          ja: "勝者のみ",
          en: "Winner correct",
          ko: "승자만",
          zh: "仅胜者",
          es: "Solo ganador",
          pt: "Só vencedor",
          fr: "Vainqueur seul",
        })
      : L(lang, {
          ja: "勝者のみ的中",
          en: "Winner correct",
          ko: "승자만 적중",
          zh: "仅胜者命中",
          es: "Solo ganador acertado",
          pt: "Só vencedor certo",
          fr: "Vainqueur seul correct",
        }),
    winnerAndGames: compact
      ? L(lang, {
          ja: "勝者＋試合数",
          en: "Winner + games",
          ko: "승자+경기수",
          zh: "胜者+场数",
          es: "Ganador + partidos",
          pt: "Vencedor + jogos",
          fr: "Vainqueur + matchs",
        })
      : L(lang, {
          ja: "勝者＋試合数的中",
          en: "Winner + games",
          ko: "승자+경기수 적중",
          zh: "胜者+场数命中",
          es: "Ganador + partidos",
          pt: "Vencedor + jogos",
          fr: "Vainqueur + matchs",
        }),
  };
}
