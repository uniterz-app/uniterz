/**
 * シーズン順位 / アワード予想ページ・パネルの UI コピー（ja / en）。
 */
export type SeasonPredictUiLang = "ja" | "en";

export function seasonPredictStandingsPageSubtitle(
  lang: SeasonPredictUiLang,
  submitOpen: boolean
): string {
  if (lang === "en") {
    return submitOpen
      ? "Rank East / West 1–15. Each team can be used once per conference."
      : "Post-deadline board. Tap a team for rank-band shares.";
  }
  return submitOpen
    ? "East / West 各 1〜15 位を予想。同じチームは同じカンファレンス内で一度だけ使えます。"
    : "締切後の提出集計。チームを押すと順位帯のシェアが見られます。";
}

export function seasonPredictAwardsPageSubtitle(
  lang: SeasonPredictUiLang,
  submitOpen: boolean
): string {
  if (lang === "en") {
    return submitOpen
      ? "Predict major awards. Pick from popular candidates or search by name."
      : "Post-deadline crowd shares for each award.";
  }
  return submitOpen
    ? "MVP・DPOY など主要アワードを予想。候補は人気ピックから選び、名前検索でも絞り込めます。"
    : "締切後の提出集計。各アワードのシェア Top5 です。";
}

export function seasonPredictMarketPendingBody(lang: SeasonPredictUiLang): string {
  return lang === "en"
    ? "The deadline has passed. The market will appear here once aggregation is ready."
    : "提出期限を過ぎました。集計が完了次第、ここにマーケットが表示されます。";
}

export function seasonPredictStandingsIncompleteError(
  lang: SeasonPredictUiLang
): string {
  return lang === "en"
    ? "Fill ranks 1–15 for both East and West before submitting."
    : "East / West それぞれ 1〜15 位を埋めてから提出してください。";
}

export function seasonPredictAwardsIncompleteError(
  lang: SeasonPredictUiLang
): string {
  return lang === "en"
    ? "Pick a player for all 7 awards before submitting."
    : "7つのアワードすべて選んでから提出してください。";
}

export function seasonPredictInvalidSubmitError(
  lang: SeasonPredictUiLang
): string {
  return lang === "en"
    ? "Invalid submit response"
    : "提出レスポンスが不正です";
}

export function seasonPredictStandingsBoardHint(
  lang: SeasonPredictUiLang
): string {
  return lang === "en"
    ? "1–6 straight in / 7–10 play-in / 11–15 out. Scoring, Units, and deadline: tap ? above."
    : "1–6 ストレートイン / 7–10 プレーイン / 11–15 圏外。採点・Unit・提出期限は右上のはてなを参照。";
}

export function seasonPredictStandingsHowTo(
  lang: SeasonPredictUiLang,
  variant: "mobile" | "web"
): string {
  if (lang === "en") {
    return variant === "web"
      ? "Left East (cyan) · right West (amber). Tap a rank → pick a team below. Tap the same rank again to clear."
      : "Tap a rank → pick a team below. Placed teams leave the tray. Tap the same rank again to clear.";
  }
  return variant === "web"
    ? "左が East（シアン）・右が West（アンバー）。順位をタップ → 下にチームスロット。同じ順位をもう一度タップでクリア。"
    : "順位をタップ → 下にチームスロット。配置済みはスロットから消えます。同じ順位をもう一度タップでクリア。";
}

export function seasonPredictStandingsTrayEmpty(
  lang: SeasonPredictUiLang
): string {
  return lang === "en" ? "All teams placed" : "全チーム配置済み";
}

export function seasonPredictStandingsConfHeading(
  lang: SeasonPredictUiLang,
  isEast: boolean
): string {
  if (lang === "en") {
    return isEast ? "EASTERN · 1–15" : "WESTERN · 1–15";
  }
  return isEast ? "イースタン · 1–15" : "ウェスタン · 1–15";
}

export function seasonPredictStandingsSlotHint(
  lang: SeasonPredictUiLang,
  selected: boolean
): string {
  if (lang === "en") {
    return selected ? "Pick a team below" : "Tap to place";
  }
  return selected ? "下からチームを選ぶ" : "タップして配置";
}

export function seasonPredictStandingsClearHint(
  lang: SeasonPredictUiLang
): string {
  return lang === "en" ? "Tap again to clear" : "もう一度タップでクリア";
}

export function seasonPredictStandingsMarketHint(
  lang: SeasonPredictUiLang
): string {
  return lang === "en"
    ? "Crowd-average standings. Tap a team for 1–3 / 4–6 / 7–9 / 10–12 / 13–15 placement shares."
    : "平均予想の順位表。チームを押すと 1–3 / 4–6 / 7–9 / 10–12 / 13–15 の置き方シェアが出ます。";
}

export function seasonPredictAwardsPredictHint(
  lang: SeasonPredictUiLang
): string {
  return lang === "en"
    ? "On focus, ~5 popular picks from other users. Type to filter by name. Scoring, Units, deadline: tap ? above."
    : "フォーカス直後は他ユーザー人気ピック約 5 人。入力すると名前の前方一致で候補が出ます。採点・Unit・提出期限は右上のはてなを参照。";
}

export function seasonPredictAwardsMarketHint(
  lang: SeasonPredictUiLang
): string {
  return lang === "en"
    ? "Top 5 submission share per award. Same layout as the live post-deadline market."
    : "各アワードの提出シェア Top5。締切後に公開される本番ビューと同じレイアウトです。";
}

export function seasonPredictNudgeCopy(lang: SeasonPredictUiLang): {
  title: string;
  body: string;
  later: string;
  goStandings: string;
} {
  if (lang === "en") {
    return {
      title: "Predict standings too?",
      body: "Awards submitted. You can also rank East / West standings.",
      later: "Later",
      goStandings: "Go to standings",
    };
  }
  return {
    title: "順位予想もしますか？",
    body: "アワード予想を提出しました。続けて East / West の順位予想もできます。",
    later: "あとで",
    goStandings: "順位予想へ",
  };
}
