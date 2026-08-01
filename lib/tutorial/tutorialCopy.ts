/**
 * アプリ初回チュートリアル — ステップ文言・ターゲット定義。
 * フェーズ1は日本語固定。本組み込み時に messages/* へ移す。
 */

export type TutorialSlideId =
  | "welcome"
  | "games"
  | "predict"
  | "result"
  | "rankings"
  | "leaderboards";

/** スライド／ライブコーチ共通の図解 ID */
export type TutorialVisualId =
  | "welcome"
  | "matchCard"
  | "predictForm"
  | "result"
  | "rankings"
  | "tabs"
  | "groups"
  | "profile"
  | "tabs-rankings"
  | "tabs-boards"
  | "tabs-profile";

export type TutorialSlide = {
  id: TutorialSlideId;
  kicker: string;
  title: string;
  body: string;
  /** 図解の種類 */
  visual: TutorialVisualId;
};

/** パターンA・B 共通の6ステップ */
export const TUTORIAL_SLIDES: readonly TutorialSlide[] = [
  {
    id: "welcome",
    kicker: "WELCOME",
    title: "UNITERZへようこそ",
    body: "試合の結果を予想してポイントを稼ぎ、ランキングを競うアプリです。まずは基本の流れを見てみましょう。",
    visual: "welcome",
  },
  {
    id: "games",
    kicker: "GAMES",
    title: "試合カードをタップ",
    body: "試合タブでは今日のカードが並びます。気になる試合をタップすると、予想入力が開きます。",
    visual: "matchCard",
  },
  {
    id: "predict",
    kicker: "PREDICT",
    title: "勝敗・スコアを予想",
    body: "どちらが勝つか、何点かを選んで投稿。締め切り前ならあとから修正もできます。",
    visual: "predictForm",
  },
  {
    id: "result",
    kicker: "RESULT",
    title: "試合後に答え合わせ",
    body: "リザルトタブで自分の予想と実際のスコアを確認。的中するとポイントが入ります。",
    visual: "result",
  },
  {
    id: "rankings",
    kicker: "RANKINGS",
    title: "ランキングをチェック",
    body: "的中ポイントで順位が決まります。期間やカテゴリを切り替えて、自分の位置を確認しましょう。",
    visual: "rankings",
  },
  {
    id: "leaderboards",
    kicker: "MORE",
    title: "コミュニティとマイページ",
    body: "リーダーボードではコミュニティと対戦。マイページでは自分の成績や設定を確認できます。",
    visual: "tabs",
  },
] as const;

/** パターンC: 短い3枚 */
export type TutorialHybridSlideId = "welcome" | "flow" | "start";

export type TutorialHybridSlide = {
  id: TutorialHybridSlideId;
  kicker: string;
  title: string;
  body: string;
};

export const TUTORIAL_HYBRID_SLIDES: readonly TutorialHybridSlide[] = [
  {
    id: "welcome",
    kicker: "WELCOME",
    title: "UNITERZへようこそ",
    body: "試合を予想してポイントを稼ぎ、ランキングを競いましょう。",
  },
  {
    id: "flow",
    kicker: "HOW TO PLAY",
    title: "遊び方はかんたん",
    body: "試合カードをタップ → 勝敗・スコアを予想 → 的中でランクアップ。",
  },
  {
    id: "start",
    kicker: "READY",
    title: "さっそく予想してみよう",
    body: "閉じると試合カードが光ります。光っているカードをタップして、最初の予想を投稿してください。",
  },
] as const;

/** スポットライト対象の data 属性値 */
export type TutorialTargetId =
  | "match-card"
  | "predict-area"
  | "tab-result"
  | "tab-rankings"
  | "tab-leaderboards"
  | "tab-profile";

export type TutorialSpotlightStep = {
  slideIndex: number;
  target: TutorialTargetId;
  placement: "top" | "bottom";
};

/** スライド index と画面上のハイライト対象の対応 */
export const TUTORIAL_SPOTLIGHT_STEPS: readonly TutorialSpotlightStep[] = [
  { slideIndex: 0, target: "match-card", placement: "bottom" },
  { slideIndex: 1, target: "match-card", placement: "bottom" },
  { slideIndex: 2, target: "predict-area", placement: "top" },
  { slideIndex: 3, target: "tab-result", placement: "top" },
  { slideIndex: 4, target: "tab-rankings", placement: "top" },
  { slideIndex: 5, target: "tab-leaderboards", placement: "top" },
] as const;

export const TUTORIAL_PULSE_HINT_LABEL = "タップして予想!";

/** プレビュー用パターン ID */
export type TutorialPreviewPattern = "slides" | "spotlight" | "hybrid";

export const TUTORIAL_PREVIEW_PATTERNS: readonly {
  id: TutorialPreviewPattern;
  label: string;
  desc: string;
}[] = [
  {
    id: "slides",
    label: "A · スライド",
    desc: "フルスクリーンのカード送りで全体を図解",
  },
  {
    id: "spotlight",
    label: "B · スポットライト",
    desc: "実画面上で要素をくり抜きながら案内",
  },
  {
    id: "hybrid",
    label: "C · 練習ツアー",
    desc: "NBAモックで予想→HIT/MISS→ランキング/グループ/プロフィール",
  },
] as const;
