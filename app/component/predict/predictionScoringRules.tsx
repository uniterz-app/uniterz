"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Language } from "@/lib/i18n/language";
import type { ScoringSport } from "@/lib/scoring/leagueScoringSport";

export type ScoringRulesDisplaySize = "mobile" | "web";

const ScoringRulesDisplayContext = createContext<ScoringRulesDisplaySize>("mobile");

export function ScoringRulesDisplayProvider({
  size,
  children,
}: {
  size: ScoringRulesDisplaySize;
  children: ReactNode;
}) {
  return (
    <ScoringRulesDisplayContext.Provider value={size}>
      {children}
    </ScoringRulesDisplayContext.Provider>
  );
}

function useScoringRulesUi() {
  const size = useContext(ScoringRulesDisplayContext);
  const isWeb = size === "web";
  return {
    sectionTitle: isWeb
      ? "mb-2 text-lg font-bold text-white/95 sm:text-xl"
      : "mb-1.5 text-base font-bold text-white/95 sm:text-lg",
    sectionIntro: isWeb
      ? "mb-2.5 text-sm leading-relaxed text-white/55 sm:text-[15px]"
      : "mb-2 text-[12px] leading-relaxed text-white/55 sm:text-sm",
    block: isWeb
      ? "rounded-lg border border-white/[0.07] px-3.5 py-2.5 text-sm leading-relaxed text-white/75 sm:text-[15px]"
      : "rounded-lg border border-white/[0.07] px-2.5 py-2.5 text-[12px] leading-relaxed text-white/75 sm:text-sm",
    blockListGap: isWeb ? "space-y-2.5" : "space-y-2",
    sectionGap: isWeb ? "space-y-5" : "space-y-4",
    subhead: isWeb
      ? "mb-2 font-semibold text-white/85 text-sm sm:text-base"
      : "mb-1.5 font-semibold text-white/85 text-[13px] sm:text-sm",
    muted: isWeb
      ? "text-white/60 text-[13px] sm:text-sm"
      : "text-white/60 text-[12px] sm:text-[13px]",
    mutedSm: isWeb
      ? "text-white/55 text-[13px] sm:text-sm"
      : "text-white/55 text-[12px] sm:text-[13px]",
    listSpacing: isWeb ? "space-y-2" : "space-y-1.5",
  };
}

function BlockSubhead({ children }: { children: ReactNode }) {
  const ui = useScoringRulesUi();
  return <p className={ui.subhead}>{children}</p>;
}

function Em({ children }: { children: ReactNode }) {
  return (
    <span className="font-semibold text-cyan-200/95 [text-shadow:0_0_24px_rgba(34,211,238,0.12)]">
      {children}
    </span>
  );
}

function Num({ children }: { children: ReactNode }) {
  return (
    <span className="font-semibold tabular-nums text-yellow-300">{children}</span>
  );
}

function Zero({ children }: { children: ReactNode }) {
  return (
    <span className="font-semibold tabular-nums text-rose-300/85">{children}</span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  const ui = useScoringRulesUi();
  return <h3 className={ui.sectionTitle}>{children}</h3>;
}

function SectionIntro({ children }: { children: ReactNode }) {
  const ui = useScoringRulesUi();
  return <p className={ui.sectionIntro}>{children}</p>;
}

function RuleBlock({ children }: { children: ReactNode }) {
  const ui = useScoringRulesUi();
  return <li className={[ui.block, "bg-white/2"].join(" ")}>{children}</li>;
}

function HighlightBlock({ children }: { children: ReactNode }) {
  const ui = useScoringRulesUi();
  return (
    <li className={[ui.block, "bg-linear-to-r from-cyan-500/7 to-transparent"].join(" ")}>
      {children}
    </li>
  );
}

function WarnBlock({ children }: { children: ReactNode }) {
  const ui = useScoringRulesUi();
  return (
    <li
      className={[
        ui.block,
        "border-rose-500/15 bg-linear-to-r from-rose-500/6 to-transparent",
      ].join(" ")}
    >
      {children}
    </li>
  );
}

function TotalScoreBonusRulesJa({ showWcGoalScorer = false }: { showWcGoalScorer?: boolean }) {
  const ui = useScoringRulesUi();
  return (
    <ul className={["list-disc pl-4 text-white/70", ui.listSpacing].join(" ")}>
      {showWcGoalScorer ? (
        <li className="space-y-1">
          <span>
            <Em>得点者ボーナス</Em> … <Num>+2点</Num>
          </span>
          <p className={ui.muted}>
            ゴールする選手を1人予想して的中（オウンゴール除く。勝者予想とは別枠）
          </p>
        </li>
      ) : null}
      <li className="space-y-1">
        <span>
          <Em>アップセットボーナス</Em> … <Num>+2点</Num>
        </span>
        <p className={ui.muted}>
          市場の <Num>45%以下</Num> の側を予想して的中した番狂わせ試合
        </p>
      </li>
      <li className="space-y-1">
        <span>
          <Em>連勝ボーナス</Em>
        </span>
        <ul className={["list-disc pl-4", ui.muted].join(" ")}>
          <li>
            3〜4連勝 … <Num>+1点</Num>
          </li>
          <li>
            5〜6連勝 … <Num>+2点</Num>
          </li>
          <li>
            7連勝以上 … <Num>+3点</Num>
          </li>
        </ul>
        <p className={ui.mutedSm}>2連勝以下は0点</p>
      </li>
    </ul>
  );
}

function TotalScoreBonusRulesEn({ showWcGoalScorer = false }: { showWcGoalScorer?: boolean }) {
  const ui = useScoringRulesUi();
  return (
    <ul className={["list-disc pl-4 text-white/70", ui.listSpacing].join(" ")}>
      {showWcGoalScorer ? (
        <li className="space-y-1">
          <span>
            <Em>Goal scorer bonus</Em> … <Num>+2</Num>
          </span>
          <p className={ui.muted}>
            Pick one scorer; +2 if they score (own goals excluded; separate from winner pick)
          </p>
        </li>
      ) : null}
      <li className="space-y-1">
        <span>
          <Em>Upset bonus</Em> … <Num>+2</Num>
        </span>
        <p className={ui.muted}>
          Upset game + correct pick on the <Num>45% or below</Num> market side
        </p>
      </li>
      <li className="space-y-1">
        <span>
          <Em>Win-streak bonus</Em>
        </span>
        <ul className={["list-disc pl-4", ui.muted].join(" ")}>
          <li>
            3–4 wins … <Num>+1</Num>
          </li>
          <li>
            5–6 wins … <Num>+2</Num>
          </li>
          <li>
            7+ wins … <Num>+3</Num>
          </li>
        </ul>
        <p className={ui.mutedSm}>0 at 2 wins or below</p>
      </li>
    </ul>
  );
}

function BasketballTotalRulesJa() {
  return (
    <ul className="space-y-2">
      <WarnBlock>
        <Em>勝者予想が外れた試合</Em>は <Zero>0点</Zero>。連勝・アップセットのボーナスもつきません。
      </WarnBlock>
      <HighlightBlock>
        <BlockSubhead>勝者が合っているとき（基本点・最大10点）</BlockSubhead>
        <ol className="list-decimal space-y-1.5 pl-4">
          <li>
            <Em>勝者</Em> … <Num>+4点</Num>（ホーム勝／アウェイ勝の当てはずれ）
          </li>
          <li>
            <Em>得失点差</Em> … 最大 <Num>+4点</Num>
            <br />
            <span className="text-white/60">
              例：予想 110–105（差5）・結果 100–95（差5）→ 差が同じなので満点に近い。差のズレが大きいほど減点（ズレ15以上は0点）。
            </span>
          </li>
          <li>
            <Em>合計得点</Em>（両チームの点数の合計）… 最大 <Num>+2点</Num>
            <br />
            <span className="text-white/60">合計が近いほど高得点。ズレが大きいと +1 や 0 になります。</span>
          </li>
        </ol>
      </HighlightBlock>
      <RuleBlock>
        <BlockSubhead>ボーナス（基本点に上乗せ）</BlockSubhead>
        <TotalScoreBonusRulesJa />
      </RuleBlock>
      <RuleBlock>
        <Em>総合得点</Em> ＝ 基本点 ＋ ボーナス（ボーナスで <Num>10点超</Num> になることもあります）
      </RuleBlock>
    </ul>
  );
}

function BasketballTotalRulesEn() {
  return (
    <ul className="space-y-2">
      <WarnBlock>
        Wrong <Em>winner</Em> → <Zero>0</Zero> for that game (no streak or upset bonuses).
      </WarnBlock>
      <HighlightBlock>
        <BlockSubhead>When the winner is correct (base, max 10)</BlockSubhead>
        <ol className="list-decimal space-y-1.5 pl-4">
          <li>
            <Em>Winner</Em> … <Num>+4</Num>
          </li>
          <li>
            <Em>Point margin</Em> … up to <Num>+4</Num> (closer margin → more points; error ≥15 → 0)
          </li>
          <li>
            <Em>Combined total</Em> (home + away points) … up to <Num>+2</Num>
          </li>
        </ol>
      </HighlightBlock>
      <RuleBlock>
        <BlockSubhead>Bonuses (added on top)</BlockSubhead>
        <TotalScoreBonusRulesEn />
      </RuleBlock>
      <RuleBlock>
        <Em>Total score</Em> = base + bonuses (can exceed <Num>10</Num>)
      </RuleBlock>
    </ul>
  );
}

function FootballTotalRulesJa({ showWcGoalScorer = false }: { showWcGoalScorer?: boolean }) {
  return (
    <ul className="space-y-2">
      <WarnBlock>
        <Em>勝者予想が外れた試合</Em>は基本点 <Zero>0点</Zero>
        {showWcGoalScorer
          ? "（得点者ボーナスは別枠で加点あり）。"
          : "（ボーナスもなし）。"}
      </WarnBlock>
      <RuleBlock>
        <span className="text-white/60">
          採点に使うスコアは<Em>規定時間＋延長</Em>の結果（PK戦の本数は含みません）。
        </span>
      </RuleBlock>
      <HighlightBlock>
        <BlockSubhead>勝者が合っているとき（基本点・最大10点）</BlockSubhead>
        <ol className="list-decimal space-y-1.5 pl-4">
          <li>
            <Em>勝者</Em> … <Num>+4点</Num>
          </li>
          <li>
            <Em>合計ゴール数</Em> … <Num>+2点</Num>
            <p className="mt-1 text-white/60">
              ホームとアウェイのゴールを足した数が、予想と結果で同じくくりなら加点。
              <Num>0〜2</Num>／<Num>3〜4</Num>／<Num>5以上</Num> の3つに分けます。
            </p>
            <p className="mt-1 text-white/55">
              例）予想 <Num>2–1</Num>（合計3）・結果 <Num>1–2</Num>（合計3）→ <Num>+2点</Num>
              <br />
              例）予想 <Num>1–0</Num>（合計1）・結果 <Num>2–1</Num>（合計3）→ くくりが違うので 0点
            </p>
          </li>
          <li>
            <Em>得失点差</Em> … <Num>+2点</Num>
            <p className="mt-1 text-white/60">
              得失点差が予想と結果で同じなら加点します。
            </p>
            <p className="mt-1 text-white/55">
              例）予想 <Num>2–0</Num>（差2）・結果 <Num>3–1</Num>（差2）→ <Num>+2点</Num>
            </p>
          </li>
          <li>
            <Em>スコアの完全一致</Em> … <Num>+2点</Num>
          </li>
        </ol>
      </HighlightBlock>
      <RuleBlock>
        <BlockSubhead>ボーナス（基本点に上乗せ）</BlockSubhead>
        <TotalScoreBonusRulesJa showWcGoalScorer={showWcGoalScorer} />
      </RuleBlock>
      <RuleBlock>
        <Em>総合得点</Em> ＝ 基本点 ＋ ボーナス
      </RuleBlock>
    </ul>
  );
}

function FootballTotalRulesEn({ showWcGoalScorer = false }: { showWcGoalScorer?: boolean }) {
  return (
    <ul className="space-y-2">
      <WarnBlock>
        Wrong <Em>winner</Em> → <Zero>0</Zero> base
        {showWcGoalScorer
          ? " (goal scorer bonus is separate)."
          : " (no bonuses)."}
      </WarnBlock>
      <RuleBlock>
        Line score = <Em>regulation + extra time</Em> (penalty shootout goals not counted).
      </RuleBlock>
      <HighlightBlock>
        <BlockSubhead>When the winner is correct (base, max 10)</BlockSubhead>
        <ol className="list-decimal space-y-1.5 pl-4">
          <li>
            <Em>Winner</Em> … <Num>+4</Num>
          </li>
          <li>
            <Em>Total goals</Em> … <Num>+2</Num>
            <p className="mt-1 text-white/60">
              Home + away goals fall in the same bucket in your pick and the result:{" "}
              <Num>0–2</Num> / <Num>3–4</Num> / <Num>5+</Num>.
            </p>
            <p className="mt-1 text-white/55">
              e.g. pick <Num>2–1</Num> (3 total), result <Num>1–2</Num> (3 total) → <Num>+2</Num>
              <br />
              e.g. pick <Num>1–0</Num> (1 total), result <Num>2–1</Num> (3 total) → different
              buckets, <Num>0</Num> for this item
            </p>
          </li>
          <li>
            <Em>Goal difference</Em> … <Num>+2</Num>
            <p className="mt-1 text-white/60">
              +2 if the goal difference matches your pick and the result.
            </p>
            <p className="mt-1 text-white/55">
              e.g. pick <Num>2–0</Num> (diff 2), result <Num>3–1</Num> (diff 2) → <Num>+2</Num>
            </p>
          </li>
          <li>
            <Em>Exact score</Em> … <Num>+2</Num>
          </li>
        </ol>
      </HighlightBlock>
      <RuleBlock>
        <BlockSubhead>Bonuses (added on top)</BlockSubhead>
        <TotalScoreBonusRulesEn showWcGoalScorer={showWcGoalScorer} />
      </RuleBlock>
      <RuleBlock>
        <Em>Total score</Em> = base + bonuses
      </RuleBlock>
    </ul>
  );
}

function BasketballPrecisionRulesJa() {
  return (
    <ul className="space-y-2">
      <RuleBlock>
        1試合あたり <Num>0〜10点</Num>。<Em>勝者を外しても</Em>つく指標です（リザルトの「スコア精度」）。
      </RuleBlock>
      <HighlightBlock>
        <BlockSubhead>3つのズレをそれぞれ採点して合計</BlockSubhead>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>
            <Em>ホームの得点</Em> … 予想と結果の差が小さいほど高得点（最大 <Num>3点</Num>）
          </li>
          <li>
            <Em>アウェイの得点</Em> … 同様（最大 <Num>3点</Num>）
          </li>
          <li>
            <Em>得失点差</Em> … 同様（最大 <Num>4点</Num>）
          </li>
        </ul>
        <p className="mt-1.5 text-white/60">数字がぴったりなら各項目とも満点に近く、ズレが大きいほど減点します。</p>
      </HighlightBlock>
    </ul>
  );
}

function BasketballPrecisionRulesEn() {
  return (
    <ul className="space-y-2">
      <RuleBlock>
        <Num>0–10</Num> per game. Counts even if you miss the winner (<Em>score precision</Em> on results).
      </RuleBlock>
      <HighlightBlock>
        <BlockSubhead>Three parts, summed</BlockSubhead>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>
            <Em>Home points</Em> error (max <Num>3</Num>)
          </li>
          <li>
            <Em>Away points</Em> error (max <Num>3</Num>)
          </li>
          <li>
            <Em>Margin</Em> error (max <Num>4</Num>)
          </li>
        </ul>
        <p className="mt-1.5 text-white/60">Closer predictions score higher on each part.</p>
      </HighlightBlock>
    </ul>
  );
}

function FootballPrecisionRulesJa() {
  return (
    <ul className="space-y-2">
      <RuleBlock>
        1試合あたり <Num>0〜10点</Num>。<Em>勝者を外しても</Em>つく指標です（リザルトの「スコア精度」）。
      </RuleBlock>
      <HighlightBlock>
        <BlockSubhead>次の3つで加点（合計10点満点）</BlockSubhead>
        <ol className="list-decimal space-y-1.5 pl-4">
          <li>
            <Em>勝ち負けの区分</Em>が同じ（ホーム勝／引き分け／アウェイ勝）… 最大 <Num>4点</Num>
          </li>
          <li>
            <Em>合計ゴール数</Em> … 最大 <Num>4点</Num>
            <p className="mt-1 text-white/60">
              予想と結果で同じくくりなら加点（総合得点と同じ）。
              <Num>0〜2</Num>／<Num>3〜4</Num>／<Num>5以上</Num>
            </p>
          </li>
          <li>
            <Em>スコアの近さ</Em> … 最大 <Num>2点</Num>
            <p className="mt-1 text-white/60">
              ホームとアウェイの「予想の得点」と「結果の得点」のズレを足した数が、小さいほど高得点です。
            </p>
            <p className="mt-1 text-white/55">
              例）予想 <Num>2–1</Num>・結果 <Num>2–0</Num> → ホーム差0＋アウェイ差1＝合計1
            </p>
          </li>
        </ol>
      </HighlightBlock>
    </ul>
  );
}

function FootballPrecisionRulesEn() {
  return (
    <ul className="space-y-2">
      <RuleBlock>
        <Num>0–10</Num> per game. Counts even if you miss the winner.
      </RuleBlock>
      <HighlightBlock>
        <BlockSubhead>Three checks (max 10 total)</BlockSubhead>
        <ol className="list-decimal space-y-1.5 pl-4">
          <li>
            Same <Em>outcome</Em> (home / draw / away) … up to <Num>4</Num>
          </li>
          <li>
            <Em>Total goals</Em> … up to <Num>4</Num>
            <p className="mt-1 text-white/60">
              Same buckets as total score: <Num>0–2</Num> / <Num>3–4</Num> / <Num>5+</Num>
            </p>
          </li>
          <li>
            <Em>Score closeness</Em> … up to <Num>2</Num>
            <p className="mt-1 text-white/60">
              Add how far off home and away scores each are; smaller total = more points.
            </p>
            <p className="mt-1 text-white/55">
              e.g. pick <Num>2–1</Num>, result <Num>2–0</Num> → 0 + 1 = 1 total error
            </p>
          </li>
        </ol>
      </HighlightBlock>
    </ul>
  );
}

function UpsetPointsRulesJa() {
  return (
    <ul className="space-y-2">
      <RuleBlock>
        総合得点に足される<Em>UPSETボーナス（+2点）</Em>とは別の指標です（条件はほぼ同じ）。
      </RuleBlock>
      <HighlightBlock>
        <BlockSubhead>① アップセット得点が付く条件</BlockSubhead>
        <p className="text-white/70">
          あなたの予想が<Em>少数派</Em>（市場の <Num>45%以下</Num> の側）で、かつ<Em>的中</Em>していれば、アップセット得点が加算されます。
        </p>
      </HighlightBlock>
      <HighlightBlock>
        <BlockSubhead>② 何点付くか</BlockSubhead>
        <p className="text-white/70">
          <Em>多数派だった側</Em>の市場支持率（％）が高いほど、アップセット得点は高くなります。
        </p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-white/70">
          <li>
            多数派が <Num>55%未満</Num> … <Num>0点</Num>
          </li>
          <li>
            <Num>55%以上〜90%未満</Num> … 支持率が高いほど加点（段階的）
          </li>
          <li>
            多数派が <Num>90%以上</Num> … <Num>10点</Num>
          </li>
        </ul>
        <p className="mt-1.5 text-white/55">
          例）ホームが市場 <Num>70%</Num> の多数派なのにアウェイが勝利 → あなたがアウェイ勝で当てていれば、おおよそ{" "}
          <Num>8点</Num> 前後
        </p>
      </HighlightBlock>
      <RuleBlock>
        同じ条件を満たすと、総合得点には別途 <Num>+2点</Num> のUPSETボーナスも付きます。
      </RuleBlock>
    </ul>
  );
}

function UpsetPointsRulesEn() {
  return (
    <ul className="space-y-2">
      <RuleBlock>
        Separate from the <Em>+2 upset bonus</Em> on total score (similar conditions).
      </RuleBlock>
      <HighlightBlock>
        <BlockSubhead>① When you earn upset points</BlockSubhead>
        <p className="text-white/70">
          If your pick is a <Em>minority</Em> side (<Num>45% or below</Num> on the market) and you{" "}
          <Em>hit</Em>, upset points are added.
        </p>
      </HighlightBlock>
      <HighlightBlock>
        <BlockSubhead>② How many points</BlockSubhead>
        <p className="text-white/70">
          Based on the <Em>majority side’s</Em> market share (how strong the wrong crowd was):
        </p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-white/70">
          <li>
            Majority <Num>&lt;55%</Num> … <Num>0</Num>
          </li>
          <li>
            <Num>55–90%</Num> … scales up with share
          </li>
          <li>
            Majority <Num>90%+</Num> … <Num>10</Num>
          </li>
        </ul>
        <p className="mt-1.5 text-white/55">
          e.g. 70% home majority but away wins → correct away pick scores around <Num>8</Num>
        </p>
      </HighlightBlock>
      <RuleBlock>
        The same hit also adds <Num>+2</Num> upset bonus to total score.
      </RuleBlock>
    </ul>
  );
}

/** 予想フォームの採点ルールチップ用（総合得点＋スコア精度＋アップセット得点） */
export function PredictionScoringFullRulesBody({
  sport,
  language,
  league,
}: {
  sport: ScoringSport;
  language: Language;
  league?: string;
}) {
  const showWcGoalScorer = String(league ?? "").toLowerCase() === "wc";
  const isEn = language === "en";
  const totalTitle = isEn ? "Total score" : "総合得点";
  const precisionTitle = isEn ? "Score precision" : "スコア精度";
  const upsetTitle = isEn ? "Upset points" : "アップセット得点";
  const totalIntro = isEn
    ? "Main points per game on results and leaderboards."
    : "リザルトやランキングで使う、試合ごとのメインのポイントです。";
  const precisionIntro = isEn
    ? "How close your predicted score was—separate from total score."
    : "予想スコアが実際の結果にどれだけ近かったか。総合得点とは別の指標です。";
  const upsetIntro = isEn
    ? "When an upset happens and your minority pick wins."
    : "波乱した試合で、少数派予想が当たったときの加点です。";

  const total =
    sport === "football"
      ? isEn
        ? <FootballTotalRulesEn showWcGoalScorer={showWcGoalScorer} />
        : <FootballTotalRulesJa showWcGoalScorer={showWcGoalScorer} />
      : isEn
        ? <BasketballTotalRulesEn />
        : <BasketballTotalRulesJa />;

  const precision =
    sport === "football"
      ? isEn
        ? <FootballPrecisionRulesEn />
        : <FootballPrecisionRulesJa />
      : isEn
        ? <BasketballPrecisionRulesEn />
        : <BasketballPrecisionRulesJa />;

  const upset = isEn ? <UpsetPointsRulesEn /> : <UpsetPointsRulesJa />;

  const ui = useScoringRulesUi();

  return (
    <div className={ui.sectionGap}>
      <div>
        <SectionTitle>{totalTitle}</SectionTitle>
        <SectionIntro>{totalIntro}</SectionIntro>
        {total}
      </div>
      <div>
        <SectionTitle>{precisionTitle}</SectionTitle>
        <SectionIntro>{precisionIntro}</SectionIntro>
        {precision}
      </div>
      <div>
        <SectionTitle>{upsetTitle}</SectionTitle>
        <SectionIntro>{upsetIntro}</SectionIntro>
        {upset}
      </div>
    </div>
  );
}
