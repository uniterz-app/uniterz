/**
 * バッジ title / description の言語解決。
 * Firestore に titleEn / descriptionEn があれば優先。無ければ JA 文言をパターン翻訳。
 */

export type BadgeCopyLang = "ja" | "en";

export type BadgeCopySource = {
  id?: string;
  title?: string | null;
  description?: string | null;
  titleEn?: string | null;
  descriptionEn?: string | null;
};

export type ResolvedBadgeCopy = {
  title: string;
  description: string;
};

const MONTHLY_METRIC_TITLE: Record<string, string> = {
  "WIN RATE": "WIN RATE",
  スコア精度: "Score Accuracy",
  予測精度: "Prediction Accuracy",
  一致度: "Match Rate",
};

function translateJaMonthLabel(raw: string): string {
  // 2025年12月 → Dec 2025
  const m = raw.match(/^(\d{4})年(\d{1,2})月$/);
  if (!m) return raw;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[Number(m[2]) - 1];
  return month ? `${month} ${m[1]}` : raw;
}

function translateBadgeTitleJaToEn(title: string): string {
  let t = title.trim();
  if (!t) return t;

  // 月間王者（ALL 1位）
  let m = t.match(/^月間王者（ALL\s*(\d+)位）$/);
  if (m) return `Monthly Champion (ALL #${m[1]})`;

  // 月間 ALL 11〜20位 / 月間 B1 6〜10位
  m = t.match(/^月間\s+(ALL|B1|J1)\s+(\d+)〜(\d+)位$/);
  if (m) return `Monthly ${m[1]} #${m[2]}–${m[3]}`;

  // 月間 ALL 2位
  m = t.match(/^月間\s+(ALL|B1|J1)\s+(\d+)位$/);
  if (m) return `Monthly ${m[1]} #${m[2]}`;

  // PLAY IN トータルポイント TOP20（2025-26）
  m = t.match(/^PLAY IN\s+トータルポイント\s+TOP\s*(\d+)（(.+)）$/i);
  if (m) return `PLAY IN Total Points Top${m[1]} (${m[2]})`;

  // PLAY IN トータルポイント 1位（2025-26）
  m = t.match(/^PLAY IN\s+トータルポイント\s+(\d+)位（(.+)）$/);
  if (m) return `PLAY IN Total Points #${m[1]} (${m[2]})`;

  // Po 1st Round 総合得点 1st (25-26) / Po CF 総合得点 Top50 (25-26)
  m = t.match(/^(Po\s+.+?)\s+総合得点\s+(.+)$/i);
  if (m) return `${m[1]} Total Points ${m[2]}`;

  // WIN RATE 1位（2025年12月） / スコア精度 2位（2025年12月）
  m = t.match(/^(.+?)\s+(\d+)位（(.+)）$/);
  if (m) {
    const metric = MONTHLY_METRIC_TITLE[m[1]!.trim()] ?? m[1]!.trim();
    return `${metric} #${m[2]} (${translateJaMonthLabel(m[3]!)})`;
  }

  // Token replacements for mixed titles
  t = t
    .replace(/総合得点/g, "Total Points")
    .replace(/トータルポイント/g, "Total Points")
    .replace(/プレーオフ/g, "Playoffs")
    .replace(/プレーイン/g, "Play-In")
    .replace(/位/g, "")
    .replace(/〜/g, "–");

  return t;
}

function translateBadgeDescriptionJaToEn(description: string): string {
  let d = description.trim();
  if (!d) return d;

  // その月の総合ランキング1位に授与される称号。
  let m = d.match(
    /^その月の総合ランキング(\d+)(?:〜(\d+))?位に授与される称号。$/
  );
  if (m) {
    const range = m[2] ? `#${m[1]}–${m[2]}` : `#${m[1]}`;
    return `Awarded for finishing ${range} in the overall monthly ranking.`;
  }

  // その月のBリーグランキング / Jリーグランキング
  m = d.match(
    /^その月の(Bリーグ|Jリーグ)ランキング(\d+)(?:〜(\d+))?位に授与される称号。$/
  );
  if (m) {
    const league = m[1] === "Bリーグ" ? "B.League" : "J.League";
    const range = m[3] ? `#${m[2]}–${m[3]}` : `#${m[2]}`;
    return `Awarded for finishing ${range} in the ${league} monthly ranking.`;
  }

  // 2025-26 プレーオフ 1stRoundの総合得点1位に授与されるバッジ。
  m = d.match(
    /^(\d{4}-\d{2})\s+プレーオフ\s+(\S+)の総合得点(Top\d+|\d+位)に授与されるバッジ。$/i
  );
  if (m) {
    const place = m[3]!.startsWith("Top")
      ? m[3]
      : `#${m[3]!.replace(/位$/, "")}`;
    return `Awarded for ${place} in total points for the ${m[1]} Playoffs ${m[2]}.`;
  }

  // 2025-26 プレーイン期間のトータルポイントランキング1位に授与されるバッジ。
  m = d.match(
    /^(\d{4}-\d{2})\s+プレーイン期間のトータルポイントランキング(\d+)(?:位〜(\d+))?位に授与されるバッジ。$/
  );
  if (m) {
    const range = m[3] ? `#${m[2]}–${m[3]}` : `#${m[2]}`;
    return `Awarded for finishing ${range} in total points during the ${m[1]} Play-In period.`;
  }

  // TOP20 表記
  m = d.match(
    /^(\d{4}-\d{2})\s+プレーイン期間のトータルポイントランキング(\d+)位〜(\d+)位に授与されるバッジ。$/
  );
  if (m) {
    return `Awarded for finishing #${m[2]}–${m[3]} in total points during the ${m[1]} Play-In period.`;
  }

  // 25-26シーズン NBAクリスマスゲームで、チキNBAよりも的中したユーザーに授与。
  if (/クリスマス/.test(d) || /Christmas/i.test(d)) {
    return d
      .replace(
        /25-26シーズン NBAクリスマスゲームで、チキNBAよりも的中したユーザーに授与。/,
        "Awarded to users who outperformed Chiki NBA in the 25-26 NBA Christmas games."
      )
      .replace(
        /(\d{2}-\d{2})シーズン\s*NBAクリスマスゲームで、チキNBAよりも的中したユーザーに授与。/,
        "Awarded to users who outperformed Chiki NBA in the $1 NBA Christmas games."
      );
  }

  // Generic monthly metric awards: 「YYYY年M月の…ランキングN位に授与…」
  m = d.match(
    /^(\d{4}年\d{1,2}月)の(.+?)ランキング(\d+)位に授与される(?:称号|バッジ)。$/
  );
  if (m) {
    const metric = MONTHLY_METRIC_TITLE[m[2]!.trim()] ?? m[2]!.trim();
    return `Awarded for finishing #${m[3]} in ${metric} for ${translateJaMonthLabel(m[1]!)}.`;
  }

  // 2025年12月 勝率ランキング1位。\nもっとも勝ち続けた、12月の予想王。
  const lines = d.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const head = lines[0]!;
    const headMatch = head.match(
      /^(\d{4}年\d{1,2}月)\s+(.+?)ランキング(\d+)位。$/
    );
    if (headMatch) {
      const metricRaw = headMatch[2]!.trim();
      const metric =
        metricRaw === "勝率"
          ? "WIN RATE"
          : MONTHLY_METRIC_TITLE[metricRaw] ?? metricRaw;
      const headEn = `${metric} ranking #${headMatch[3]} for ${translateJaMonthLabel(headMatch[1]!)}.`;
      const FLAVOR: Record<string, string> = {
        "もっとも勝ち続けた、12月の予想王。":
          "The prediction king who kept winning all month.",
        "安定感抜群のトップクラス予想家。":
          "A top-tier predictor with outstanding consistency.",
        "高い勝率を誇った、実力派予想家。":
          "A skilled predictor with a strong win rate.",
      };
      const rest = lines
        .slice(1)
        .map((line) => FLAVOR[line] ?? line)
        .filter((line) => !looksMostlyJapanese(line));
      return [headEn, ...rest].join(" ");
    }
  }

  // Fallback token swap for remaining mixed JP copy
  d = d
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
    .replace(/〜/g, "–");

  return d.replace(/\s{2,}/g, " ").trim();
}

function looksMostlyJapanese(text: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9fff]/.test(text);
}

/**
 * 表示用の title / description を返す。
 * `language !== "en"` のときは JA（title / description）をそのまま使う。
 */
export function resolveBadgeCopy(
  badge: BadgeCopySource,
  language: BadgeCopyLang | string = "ja"
): ResolvedBadgeCopy {
  const titleJa = String(badge.title ?? "").trim();
  const descJa = String(badge.description ?? "").trim();
  const fallbackTitle = titleJa || String(badge.id ?? "Badge");

  if (language !== "en") {
    return { title: fallbackTitle, description: descJa };
  }

  const titleEnStored = String(badge.titleEn ?? "").trim();
  const descEnStored = String(badge.descriptionEn ?? "").trim();

  const title =
    titleEnStored ||
    (looksMostlyJapanese(fallbackTitle)
      ? translateBadgeTitleJaToEn(fallbackTitle)
      : fallbackTitle.includes("総合得点") ||
          fallbackTitle.includes("トータルポイント") ||
          fallbackTitle.includes("位")
        ? translateBadgeTitleJaToEn(fallbackTitle)
        : fallbackTitle);

  const description =
    descEnStored ||
    (descJa && looksMostlyJapanese(descJa)
      ? translateBadgeDescriptionJaToEn(descJa)
      : descJa);

  return { title, description };
}
