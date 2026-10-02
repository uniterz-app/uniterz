/**
 * ProfileAnalysisStyleMapNative 用コピー（7言語）
 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { StyleMapPoint } from "./profileAnalysisUtils";

const DEAD = 0.12;

export function analysisStyleMapUi(lang: LocalizedLang) {
  return {
    title: L(lang, {
      ja: "あなたの分析スタイル",
      en: "Your analysis style",
      ko: "나의 분석 스타일",
      zh: "你的分析风格",
      es: "Tu estilo de análisis",
      pt: "Seu estilo de análise",
      fr: "Votre style d’analyse",
    }),
    favorite: L(lang, {
      ja: "順当",
      en: "Favorite",
      ko: "정배",
      zh: "热门",
      es: "Favorito",
      pt: "Favorito",
      fr: "Favori",
    }),
    underdog: L(lang, {
      ja: "逆張り",
      en: "Underdog",
      ko: "역배",
      zh: "冷门",
      es: "Underdog",
      pt: "Azarão",
      fr: "Outsider",
    }),
    footnote: L(lang, {
      ja: "横軸：Away ←→ Home / 縦軸：順当 ←→ 逆張り\n点の大きさ：勝率（40–85%・6段階）",
      en: "X: Away ←→ Home / Y: Favorite ←→ Underdog\nDot size: win rate (40–85%, 6 tiers)",
      ko: "가로: Away ←→ Home / 세로: 정배 ←→ 역배\n점 크기: 승률(40–85%, 6단계)",
      zh: "横轴：Away ←→ Home / 纵轴：热门 ←→ 冷门\n点大小：胜率（40–85%，6 档）",
      es: "X: Away ←→ Home / Y: Favorito ←→ Underdog\nTamaño: win rate (40–85%, 6 niveles)",
      pt: "X: Away ←→ Home / Y: Favorito ←→ Azarão\nTamanho: win rate (40–85%, 6 níveis)",
      fr: "X : Away ←→ Home / Y : Favori ←→ Outsider\nTaille : win rate (40–85 %, 6 paliers)",
    }),
  };
}

export function buildAnalysisStyleComment(
  p: StyleMapPoint,
  lang: LocalizedLang
): { title: string; body: string } {
  const x = p.homeAwayBias;
  const y = -p.marketBias;
  const winPct = Math.round(p.winRate * 100);

  let axisLabel = L(lang, {
    ja: "バランス",
    en: "Balanced",
    ko: "밸런스",
    zh: "均衡",
    es: "Equilibrado",
    pt: "Equilibrado",
    fr: "Équilibré",
  });
  let typeLabel = L(lang, {
    ja: "バランス型",
    en: "balanced style",
    ko: "밸런스형",
    zh: "均衡型",
    es: "estilo equilibrado",
    pt: "estilo equilibrado",
    fr: "style équilibré",
  });
  let tendency = L(lang, {
    ja: "条件に強い偏りはありません。",
    en: "No strong bias in your picks.",
    ko: "조건에 강한 편향이 없습니다.",
    zh: "没有明显偏向。",
    es: "Sin sesgo fuerte en tus picks.",
    pt: "Sem viés forte nos palpites.",
    fr: "Pas de biais fort dans vos picks.",
  });

  if (x > DEAD && y > DEAD) {
    axisLabel = "Home × " + L(lang, {
      ja: "順当",
      en: "favorite",
      ko: "정배",
      zh: "热门",
      es: "favorito",
      pt: "favorito",
      fr: "favori",
    });
    typeLabel = L(lang, {
      ja: "セオリー重視タイプ",
      en: "theory-first type",
      ko: "이론 중시형",
      zh: "理论优先型",
      es: "tipo teoría primero",
      pt: "tipo teoria primeiro",
      fr: "type théorie d’abord",
    });
    tendency = L(lang, {
      ja: "ホーム有利や市場評価を素直に信頼し、王道条件を重視する傾向があります。",
      en: "You tend to trust home edges and market favorites.",
      ko: "홈 이점과 시장 평가를 신뢰하며 정석 조건을 중시합니다.",
      zh: "倾向信任主场优势与市场热门。",
      es: "Tiendes a confiar en el factor local y los favoritos.",
      pt: "Você tende a confiar no fator casa e nos favoritos.",
      fr: "Vous tendez à faire confiance au domicile et aux favoris.",
    });
  } else if (x > DEAD && y < -DEAD) {
    axisLabel = "Home × " + L(lang, {
      ja: "逆張り",
      en: "contrarian",
      ko: "역배",
      zh: "冷门",
      es: "contrarian",
      pt: "contrário",
      fr: "contrarian",
    });
    typeLabel = L(lang, {
      ja: "文脈判断タイプ",
      en: "context-driven type",
      ko: "맥락 판단형",
      zh: "情境判断型",
      es: "tipo contextual",
      pt: "tipo contextual",
      fr: "type contextuel",
    });
    tendency = L(lang, {
      ja: "ホーム条件でも状況次第で市場と逆の判断を行う柔軟さがあります。",
      en: "You flex against the market even on home spots.",
      ko: "홈에서도 상황에 따라 시장과 반대로 판단합니다.",
      zh: "即使在主场也会灵活反市场。",
      es: "Vas contra el mercado incluso en casa.",
      pt: "Você vai contra o mercado mesmo em casa.",
      fr: "Vous allez contre le marché même à domicile.",
    });
  } else if (x < -DEAD && y > DEAD) {
    axisLabel = "Away × " + L(lang, {
      ja: "順当",
      en: "favorite",
      ko: "정배",
      zh: "热门",
      es: "favorito",
      pt: "favorito",
      fr: "favori",
    });
    typeLabel = L(lang, {
      ja: "条件反転タイプ",
      en: "condition-aware type",
      ko: "조건 반영형",
      zh: "条件感知型",
      es: "tipo consciente del contexto",
      pt: "tipo ciente das condições",
      fr: "type conscient des conditions",
    });
    tendency = L(lang, {
      ja: "アウェイ条件を織り込んだ上で、順当な期待値を丁寧に評価しています。",
      en: "You weigh away spots while still respecting favorites.",
      ko: "어웨이 조건을 반영하면서도 정배를 신중히 평가합니다.",
      zh: "会纳入客场条件，同时仍重视热门。",
      es: "Ponderas el away y respetas a los favoritos.",
      pt: "Você pondera o away e respeita os favoritos.",
      fr: "Vous pesez l’extérieur tout en respectant les favoris.",
    });
  } else if (x < -DEAD && y < -DEAD) {
    axisLabel = "Away × " + L(lang, {
      ja: "逆張り",
      en: "contrarian",
      ko: "역배",
      zh: "冷门",
      es: "contrarian",
      pt: "contrário",
      fr: "contrarian",
    });
    typeLabel = L(lang, {
      ja: "高リスク選好タイプ",
      en: "high-risk type",
      ko: "고위험 선호형",
      zh: "高风险偏好型",
      es: "tipo alto riesgo",
      pt: "tipo alto risco",
      fr: "type haut risque",
    });
    tendency = L(lang, {
      ja: "不利条件や市場逆張りを積極的に取りにいく攻撃的な判断傾向があります。",
      en: "You chase underdogs and away spots aggressively.",
      ko: "불리 조건·역배를 적극적으로 노리는 공격적 성향입니다.",
      zh: "积极追逐冷门与客场高风险选择。",
      es: "Persigues underdogs y spots away con agresividad.",
      pt: "Você busca azares e spots away de forma agressiva.",
      fr: "Vous chasez outsiders et spots exterieurs avec agressivité.",
    });
  }

  let performance = L(lang, {
    ja: "勝率は平均的なレンジに収まっています。",
    en: "Win rate sits in an average range.",
    ko: "승률은 평균 구간에 있습니다.",
    zh: "胜率处于平均区间。",
    es: "El win rate está en un rango medio.",
    pt: "O win rate está numa faixa média.",
    fr: "Le win rate est dans une fourchette moyenne.",
  });
  if (winPct >= 66) {
    performance = L(lang, {
      ja: "勝率が高く、現在の分析スタイルは明確に機能しています。",
      en: "Win rate is strong and your style is working.",
      ko: "승률이 높고 현재 스타일이 잘 작동합니다.",
      zh: "胜率很高，当前风格明显有效。",
      es: "Win rate alto: tu estilo funciona.",
      pt: "Win rate alto: seu estilo funciona.",
      fr: "Win rate élevé : votre style fonctionne.",
    });
  } else if (winPct < 50) {
    performance = L(lang, {
      ja: "勝率が低めで、判断軸の調整余地があります。",
      en: "Win rate is low; your axes may need tuning.",
      ko: "승률이 낮아 판단축 조정이 필요할 수 있습니다.",
      zh: "胜率偏低，判断轴或需调整。",
      es: "Win rate bajo; puede que debas ajustar ejes.",
      pt: "Win rate baixo; talvez ajuste os eixos.",
      fr: "Win rate bas ; vos axes peuvent être à retoucher.",
    });
  }

  return {
    title: L(lang, {
      ja: `あなたは ${axisLabel} の ${typeLabel} です`,
      en: `You are a ${axisLabel} ${typeLabel}`,
      ko: `당신은 ${axisLabel}의 ${typeLabel}입니다`,
      zh: `你是 ${axisLabel} 的 ${typeLabel}`,
      es: `Eres un ${typeLabel} ${axisLabel}`,
      pt: `Você é um ${typeLabel} ${axisLabel}`,
      fr: `Vous êtes un ${typeLabel} ${axisLabel}`,
    }),
    body: L(lang, {
      ja: `${tendency} 現在の勝率は ${winPct}%。${performance}`,
      en: `${tendency} Current win rate: ${winPct}%. ${performance}`,
      ko: `${tendency} 현재 승률 ${winPct}%. ${performance}`,
      zh: `${tendency} 当前胜率 ${winPct}%。${performance}`,
      es: `${tendency} Win rate actual: ${winPct}%. ${performance}`,
      pt: `${tendency} Win rate atual: ${winPct}%. ${performance}`,
      fr: `${tendency} Win rate actuel : ${winPct} %. ${performance}`,
    }),
  };
}
