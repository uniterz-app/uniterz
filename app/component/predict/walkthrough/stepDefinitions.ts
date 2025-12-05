// stepDefinitions.ts
"use client";

export type WalkthroughStep = {
  key: "mainOption" | "mainOdds" | "mainPct" | "secondaryOption"; 
  target: "mainOption" | "mainOdds" | "mainPct" | "secondaryOption";
  title: string;
  body?: string; // ← JSX をやめて「文字列」にする
};

export const predictionWalkthroughSteps: WalkthroughStep[] = [
  {
    key: "mainOption",
    target: "mainOption",
    title: "まず “本命” を選びましょう",
    body: "この試合で最も当たりそうな予想を選んでください。",
  },
  {
    key: "mainOdds",
    target: "mainOdds",
    title: "オッズを入力します",
    body: "オッズは各自で確認の上入力してください、1.0 以上で手入力できます。",
  },
  {
    key: "mainPct",
    target: "mainPct",
    title: "1 unit の配分を決めます",
    body: "その予想がどれほど自信があるのかを数値を決めます。",
  },
  {
    key: "secondaryOption",
    target: "secondaryOption",
    title: "“抑え” を選びましょう",
    body: "本命とは別に、もう1つ可能性がある予想を追加します。",
  },
];
