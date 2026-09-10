/**
 * バッジ JA 文言のパターン翻訳（7言語）。
 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { BadgeCopyLang } from "./resolveBadgeCopy";

function bl(lang: BadgeCopyLang, strings: Parameters<typeof L>[1]): string {
  return L(lang as LocalizedLang, strings);
}

const MONTHLY_METRIC: Record<
  string,
  { en: string; ko: string; zh: string; es: string; pt: string; fr: string }
> = {
  "WIN RATE": {
    en: "WIN RATE",
    ko: "승률",
    zh: "胜率",
    es: "WIN RATE",
    pt: "WIN RATE",
    fr: "WIN RATE",
  },
  スコア精度: {
    en: "Score Accuracy",
    ko: "스코어 정확도",
    zh: "得分精度",
    es: "Precisión de puntuación",
    pt: "Precisão de pontuação",
    fr: "Précision du score",
  },
  予測精度: {
    en: "Prediction Accuracy",
    ko: "예측 정확도",
    zh: "预测精度",
    es: "Precisión de predicción",
    pt: "Precisão de previsão",
    fr: "Précision des prédictions",
  },
  一致度: {
    en: "Match Rate",
    ko: "일치율",
    zh: "一致度",
    es: "Tasa de acierto",
    pt: "Taxa de acerto",
    fr: "Taux de correspondance",
  },
};

function metricLabel(raw: string, lang: BadgeCopyLang): string {
  if (lang === "ja") return raw;
  const row = MONTHLY_METRIC[raw.trim()];
  if (!row) return raw;
  return bl(lang, { ja: raw, en: row.en, ko: row.ko, zh: row.zh, es: row.es, pt: row.pt, fr: row.fr });
}

function translateJaMonthLabel(raw: string, lang: BadgeCopyLang): string {
  const m = raw.match(/^(\d{4})年(\d{1,2})月$/);
  if (!m) return raw;
  const y = m[1]!;
  const mo = Number(m[2]);
  if (lang === "ja") return raw;
  const enMonths = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const en = `${enMonths[mo - 1] ?? mo} ${y}`;
  return bl(lang, {
    ja: raw,
    en,
    ko: `${y}년 ${mo}월`,
    zh: `${y}年${mo}月`,
    es: `${enMonths[mo - 1] ?? mo} ${y}`,
    pt: `${enMonths[mo - 1] ?? mo} ${y}`,
    fr: `${enMonths[mo - 1] ?? mo} ${y}`,
  });
}

export function translateBadgeTitleJaToLang(
  title: string,
  lang: BadgeCopyLang
): string {
  if (lang === "ja") return title.trim();
  let t = title.trim();
  if (!t) return t;

  let m = t.match(/^月間王者（ALL\s*(\d+)位）$/);
  if (m) {
    const n = m[1]!;
    return bl(lang, {
      ja: t,
      en: `Monthly Champion (ALL #${n})`,
      ko: `월간 챔피언 (ALL ${n}위)`,
      zh: `月度王者（ALL 第${n}名）`,
      es: `Campeón mensual (ALL #${n})`,
      pt: `Campeão mensal (ALL #${n})`,
      fr: `Champion mensuel (ALL #${n})`,
    });
  }

  m = t.match(/^月間\s+(ALL|B1|J1)\s+(\d+)〜(\d+)位$/);
  if (m) {
    const league = m[1]!;
    const a = m[2]!;
    const b = m[3]!;
    return bl(lang, {
      ja: t,
      en: `Monthly ${league} #${a}–${b}`,
      ko: `월간 ${league} ${a}–${b}위`,
      zh: `月度 ${league} 第${a}–${b}名`,
      es: `Mensual ${league} #${a}–${b}`,
      pt: `Mensal ${league} #${a}–${b}`,
      fr: `Mensuel ${league} #${a}–${b}`,
    });
  }

  m = t.match(/^月間\s+(ALL|B1|J1)\s+(\d+)位$/);
  if (m) {
    const league = m[1]!;
    const n = m[2]!;
    return bl(lang, {
      ja: t,
      en: `Monthly ${league} #${n}`,
      ko: `월간 ${league} ${n}위`,
      zh: `月度 ${league} 第${n}名`,
      es: `Mensual ${league} #${n}`,
      pt: `Mensal ${league} #${n}`,
      fr: `Mensuel ${league} #${n}`,
    });
  }

  m = t.match(/^PLAY IN\s+トータルポイント\s+TOP\s*(\d+)（(.+)）$/i);
  if (m) {
    const top = m[1]!;
    const season = m[2]!;
    return bl(lang, {
      ja: t,
      en: `PLAY IN Total Points Top${top} (${season})`,
      ko: `PLAY IN 토탈 포인트 Top${top} (${season})`,
      zh: `PLAY IN 总积分 Top${top}（${season}）`,
      es: `PLAY IN Puntos totales Top${top} (${season})`,
      pt: `PLAY IN Pontos totais Top${top} (${season})`,
      fr: `PLAY IN Points totaux Top${top} (${season})`,
    });
  }

  m = t.match(/^PLAY IN\s+トータルポイント\s+(\d+)位（(.+)）$/);
  if (m) {
    const n = m[1]!;
    const season = m[2]!;
    return bl(lang, {
      ja: t,
      en: `PLAY IN Total Points #${n} (${season})`,
      ko: `PLAY IN 토탈 포인트 ${n}위 (${season})`,
      zh: `PLAY IN 总积分 第${n}名（${season}）`,
      es: `PLAY IN Puntos totales #${n} (${season})`,
      pt: `PLAY IN Pontos totais #${n} (${season})`,
      fr: `PLAY IN Points totaux #${n} (${season})`,
    });
  }

  m = t.match(/^(Po\s+.+?)\s+総合得点\s+(.+)$/i);
  if (m) {
    const round = m[1]!;
    const place = m[2]!;
    return bl(lang, {
      ja: t,
      en: `${round} Total Points ${place}`,
      ko: `${round} 종합 득점 ${place}`,
      zh: `${round} 综合得分 ${place}`,
      es: `${round} Puntos totales ${place}`,
      pt: `${round} Pontos totais ${place}`,
      fr: `${round} Points totaux ${place}`,
    });
  }

  m = t.match(/^(.+?)\s+(\d+)位（(.+)）$/);
  if (m) {
    const metric = metricLabel(m[1]!.trim(), lang);
    const n = m[2]!;
    const month = translateJaMonthLabel(m[3]!, lang);
    return bl(lang, {
      ja: t,
      en: `${metric} #${n} (${month})`,
      ko: `${metric} ${n}위 (${month})`,
      zh: `${metric} 第${n}名（${month}）`,
      es: `${metric} #${n} (${month})`,
      pt: `${metric} #${n} (${month})`,
      fr: `${metric} #${n} (${month})`,
    });
  }

  if (lang === "en") {
    t = t
      .replace(/総合得点/g, "Total Points")
      .replace(/トータルポイント/g, "Total Points")
      .replace(/プレーオフ/g, "Playoffs")
      .replace(/プレーイン/g, "Play-In")
      .replace(/位/g, "")
      .replace(/〜/g, "–");
    return t;
  }

  return bl(lang, {
    ja: t,
    en: translateBadgeTitleJaToLang(t, "en"),
    ko: t
      .replace(/総合得点/g, "종합 득점")
      .replace(/トータルポイント/g, "토탈 포인트")
      .replace(/プレーオフ/g, "플레이오프")
      .replace(/プレーイン/g, "플레이인")
      .replace(/位/g, "위")
      .replace(/〜/g, "–"),
    zh: t
      .replace(/総合得点/g, "综合得分")
      .replace(/トータルポイント/g, "总积分")
      .replace(/プレーオフ/g, "季后赛")
      .replace(/プレーイン/g, "附加赛")
      .replace(/位/g, "名")
      .replace(/〜/g, "–"),
    es: t
      .replace(/総合得点/g, "Puntos totales")
      .replace(/トータルポイント/g, "Puntos totales")
      .replace(/プレーオフ/g, "Playoffs")
      .replace(/プレーイン/g, "Play-In")
      .replace(/位/g, "")
      .replace(/〜/g, "–"),
    pt: t
      .replace(/総合得点/g, "Pontos totais")
      .replace(/トータルポイント/g, "Pontos totais")
      .replace(/プレーオフ/g, "Playoffs")
      .replace(/プレーイン/g, "Play-In")
      .replace(/位/g, "")
      .replace(/〜/g, "–"),
    fr: t
      .replace(/総合得点/g, "Points totaux")
      .replace(/トータルポイント/g, "Points totaux")
      .replace(/プレーオフ/g, "Playoffs")
      .replace(/プレーイン/g, "Play-In")
      .replace(/位/g, "")
      .replace(/〜/g, "–"),
  });
}

export function translateBadgeDescriptionJaToLang(
  description: string,
  lang: BadgeCopyLang
): string {
  if (lang === "ja") return description.trim();
  let d = description.trim();
  if (!d) return d;

  let m = d.match(
    /^その月の総合ランキング(\d+)(?:〜(\d+))?位に授与される称号。$/
  );
  if (m) {
    const range = m[2] ? `#${m[1]}–${m[2]}` : `#${m[1]}`;
    return bl(lang, {
      ja: d,
      en: `Awarded for finishing ${range} in the overall monthly ranking.`,
      ko: `해당 월 종합 랭킹 ${range}에 수여되는 칭호입니다.`,
      zh: `授予该月综合排名 ${range} 的称号。`,
      es: `Otorgado por quedar ${range} en la clasificación mensual general.`,
      pt: `Concedido por ficar ${range} no ranking mensal geral.`,
      fr: `Décerné pour finir ${range} au classement mensuel général.`,
    });
  }

  m = d.match(
    /^その月の(Bリーグ|Jリーグ)ランキング(\d+)(?:〜(\d+))?位に授与される称号。$/
  );
  if (m) {
    const leagueJa = m[1]!;
    const range = m[3] ? `#${m[2]}–${m[3]}` : `#${m[2]}`;
    const league = bl(lang, {
      ja: leagueJa,
      en: leagueJa === "Bリーグ" ? "B.League" : "J.League",
      ko: leagueJa === "Bリーグ" ? "B리그" : "J리그",
      zh: leagueJa === "Bリーグ" ? "B 联赛" : "J 联赛",
      es: leagueJa === "Bリーグ" ? "B.League" : "J.League",
      pt: leagueJa === "Bリーグ" ? "B.League" : "J.League",
      fr: leagueJa === "Bリーグ" ? "B.League" : "J.League",
    });
    return bl(lang, {
      ja: d,
      en: `Awarded for finishing ${range} in the ${league} monthly ranking.`,
      ko: `${league} 월간 랭킹 ${range}에 수여되는 칭호입니다.`,
      zh: `授予该月${league}排名 ${range} 的称号。`,
      es: `Otorgado por quedar ${range} en la clasificación mensual de ${league}.`,
      pt: `Concedido por ficar ${range} no ranking mensal da ${league}.`,
      fr: `Décerné pour finir ${range} au classement mensuel ${league}.`,
    });
  }

  m = d.match(
    /^(\d{4}-\d{2})\s+プレーオフ\s+(\S+)の総合得点(Top\d+|\d+位)に授与されるバッジ。$/i
  );
  if (m) {
    const season = m[1]!;
    const round = m[2]!;
    const place = m[3]!.startsWith("Top")
      ? m[3]!
      : `#${m[3]!.replace(/位$/, "")}`;
    return bl(lang, {
      ja: d,
      en: `Awarded for ${place} in total points for the ${season} Playoffs ${round}.`,
      ko: `${season} 플레이오프 ${round} 종합 득점 ${place}에 수여되는 배지입니다.`,
      zh: `授予 ${season} 季后赛 ${round} 综合得分 ${place} 的徽章。`,
      es: `Otorgado por ${place} en puntos totales de ${round} en Playoffs ${season}.`,
      pt: `Concedido por ${place} em pontos totais de ${round} nos Playoffs ${season}.`,
      fr: `Décerné pour ${place} en points totaux de ${round} aux Playoffs ${season}.`,
    });
  }

  m = d.match(
    /^(\d{4}-\d{2})\s+プレーイン期間のトータルポイントランキング(\d+)(?:位〜(\d+))?位に授与されるバッジ。$/
  );
  if (m) {
    const season = m[1]!;
    const range = m[3] ? `#${m[2]}–${m[3]}` : `#${m[2]}`;
    return bl(lang, {
      ja: d,
      en: `Awarded for finishing ${range} in total points during the ${season} Play-In period.`,
      ko: `${season} 플레이인 기간 토탈 포인트 랭킹 ${range}에 수여되는 배지입니다.`,
      zh: `授予 ${season} 附加赛期间总积分排名 ${range} 的徽章。`,
      es: `Otorgado por quedar ${range} en puntos totales durante el Play-In ${season}.`,
      pt: `Concedido por ficar ${range} em pontos totais no Play-In ${season}.`,
      fr: `Décerné pour finir ${range} en points totaux pendant le Play-In ${season}.`,
    });
  }

  m = d.match(
    /^(\d{4}-\d{2})\s+プレーイン期間のトータルポイントランキング(\d+)位〜(\d+)位に授与されるバッジ。$/
  );
  if (m) {
    const season = m[1]!;
    return bl(lang, {
      ja: d,
      en: `Awarded for finishing #${m[2]}–${m[3]} in total points during the ${season} Play-In period.`,
      ko: `${season} 플레이인 기간 토탈 포인트 랭킹 #${m[2]}–${m[3]}에 수여되는 배지입니다.`,
      zh: `授予 ${season} 附加赛期间总积分排名 #${m[2]}–${m[3]} 的徽章。`,
      es: `Otorgado por quedar #${m[2]}–${m[3]} en puntos totales durante el Play-In ${season}.`,
      pt: `Concedido por ficar #${m[2]}–${m[3]} em pontos totais no Play-In ${season}.`,
      fr: `Décerné pour finir #${m[2]}–${m[3]} en points totaux pendant le Play-In ${season}.`,
    });
  }

  if (/クリスマス/.test(d)) {
    return bl(lang, {
      ja: d,
      en: "Awarded to users who outperformed Chiki NBA in the 25-26 NBA Christmas games.",
      ko: "25-26 NBA 크리스마스 경기에서 치키 NBA보다 높은 적중률을 기록한 사용자에게 수여됩니다.",
      zh: "授予在 25-26 NBA 圣诞比赛中表现优于 Chiki NBA 的用户。",
      es: "Otorgado a quienes superaron a Chiki NBA en los partidos navideños NBA 25-26.",
      pt: "Concedido a quem superou Chiki NBA nos jogos de Natal NBA 25-26.",
      fr: "Décerné aux utilisateurs ayant surpassé Chiki NBA lors des matchs de Noël NBA 25-26.",
    });
  }

  m = d.match(
    /^(\d{4}年\d{1,2}月)の(.+?)ランキング(\d+)位に授与される(?:称号|バッジ)。$/
  );
  if (m) {
    const metric = metricLabel(m[2]!.trim(), lang);
    const month = translateJaMonthLabel(m[1]!, lang);
    const n = m[3]!;
    return bl(lang, {
      ja: d,
      en: `Awarded for finishing #${n} in ${metric} for ${month}.`,
      ko: `${month} ${metric} 랭킹 ${n}위에 수여됩니다.`,
      zh: `授予 ${month} ${metric} 排名第 ${n} 名。`,
      es: `Otorgado por quedar #${n} en ${metric} de ${month}.`,
      pt: `Concedido por ficar #${n} em ${metric} em ${month}.`,
      fr: `Décerné pour finir #${n} en ${metric} pour ${month}.`,
    });
  }

  const lines = d.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const head = lines[0]!;
    const headMatch = head.match(
      /^(\d{4}年\d{1,2}月)\s+(.+?)ランキング(\d+)位。$/
    );
    if (headMatch) {
      const metric = metricLabel(
        headMatch[2]!.trim() === "勝率" ? "WIN RATE" : headMatch[2]!.trim(),
        lang
      );
      const month = translateJaMonthLabel(headMatch[1]!, lang);
      const n = headMatch[3]!;
      const headText = bl(lang, {
        ja: head,
        en: `${metric} ranking #${n} for ${month}.`,
        ko: `${month} ${metric} 랭킹 ${n}위.`,
        zh: `${month} ${metric} 排名第 ${n} 名。`,
        es: `Ranking ${metric} #${n} de ${month}.`,
        pt: `Ranking ${metric} #${n} em ${month}.`,
        fr: `Classement ${metric} #${n} pour ${month}.`,
      });
      const FLAVOR: Record<string, Record<BadgeCopyLang, string>> = {
        "もっとも勝ち続けた、12月の予想王。": {
          ja: "もっとも勝ち続けた、12月の予想王。",
          en: "The prediction king who kept winning all month.",
          ko: "한 달 내내 승리를 이어간 예측왕.",
          zh: "整月持续获胜的预测之王。",
          es: "El rey de las predicciones que no dejó de ganar.",
          pt: "O rei das previsões que venceu o mês inteiro.",
          fr: "Le roi des prédictions invaincu tout le mois.",
        },
        "安定感抜群のトップクラス予想家。": {
          ja: "安定感抜群のトップクラス予想家。",
          en: "A top-tier predictor with outstanding consistency.",
          ko: "안정감이 뛰어난 최상급 예측가.",
          zh: "稳定性出众的一流预测者。",
          es: "Un predictor de élite con gran consistencia.",
          pt: "Um previsto de elite com consistência excepcional.",
          fr: "Un pronostiqueur d’élite d’une régularité remarquable.",
        },
        "高い勝率を誇った、実力派予想家。": {
          ja: "高い勝率を誇った、実力派予想家。",
          en: "A skilled predictor with a strong win rate.",
          ko: "높은 승률을 자랑하는 실력파 예측가.",
          zh: "胜率出色的实力派预测者。",
          es: "Un predictor experto con alto win rate.",
          pt: "Um previsto experiente com alta taxa de vitória.",
          fr: "Un pronostiqueur chevronné avec un fort taux de victoire.",
        },
      };
      const rest = lines
        .slice(1)
        .map((line) => FLAVOR[line]?.[lang] ?? line)
        .filter((line) => !/[\u3040-\u30ff\u4e00-\u9fff]/.test(line));
      return [headText, ...rest].join(" ");
    }
  }

  const enFallback = d
    .replace(/に授与される称号。/g, ".")
    .replace(/に授与されるバッジ。/g, ".")
    .replace(/授与される/g, "awarded for ")
    .replace(/その月の/g, "that month's ")
    .replace(/総合ランキング/g, "overall ranking ")
    .replace(/Bリーグランキング/g, "B.League ranking ")
    .replace(/Jリーグランキング/g, "J.League ranking ")
    .replace(/プレーオフ/g, "Playoffs ")
    .replace(/プレーイン期間/g, "Play-In period ")
    .replace(/トータルポイントランキング/g, "total points ranking ")
    .replace(/総合得点/g, "total points ")
    .replace(/勝率ランキング/g, "win rate ranking ")
    .replace(/位/g, "")
    .replace(/〜/g, "–")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (lang === "en") return enFallback;

  return bl(lang, {
    ja: d,
    en: enFallback,
    ko: d
      .replace(/に授与される称号。/g, ".")
      .replace(/に授与されるバッジ。/g, ".")
      .replace(/授与される/g, "수여됩니다 ")
      .replace(/その月の/g, "해당 월 ")
      .replace(/総合ランキング/g, "종합 랭킹 ")
      .replace(/Bリーグランキング/g, "B리그 랭킹 ")
      .replace(/Jリーグランキング/g, "J리그 랭킹 ")
      .replace(/プレーオフ/g, "플레이오프 ")
      .replace(/プレーイン期間/g, "플레이인 기간 ")
      .replace(/トータルポイントランキング/g, "토탈 포인트 랭킹 ")
      .replace(/総合得点/g, "종합 득점 ")
      .replace(/勝率ランキング/g, "승률 랭킹 ")
      .replace(/位/g, "위")
      .replace(/〜/g, "–"),
    zh: d
      .replace(/に授与される称号。/g, "。")
      .replace(/に授与されるバッジ。/g, "。")
      .replace(/授与される/g, "授予")
      .replace(/その月の/g, "该月")
      .replace(/総合ランキング/g, "综合排名")
      .replace(/Bリーグランキング/g, "B 联赛排名")
      .replace(/Jリーグランキング/g, "J 联赛排名")
      .replace(/プレーオフ/g, "季后赛")
      .replace(/プレーイン期間/g, "附加赛期间")
      .replace(/トータルポイントランキング/g, "总积分排名")
      .replace(/総合得点/g, "综合得分")
      .replace(/勝率ランキング/g, "胜率排名")
      .replace(/位/g, "名")
      .replace(/〜/g, "–"),
    es: enFallback,
    pt: enFallback,
    fr: enFallback,
  });
}
