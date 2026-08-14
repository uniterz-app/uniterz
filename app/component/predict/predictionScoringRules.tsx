"use client";

import { createContext, useContext, type ReactNode } from "react";
import { nameBebas, nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
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
  const compact = size !== "web";
  return { compact };
}

function HudKicker({ children }: { children: ReactNode }) {
  return (
    <p
      className={[
        nameOxanium.className,
        "text-[9px] font-bold uppercase tracking-[0.16em] text-white/45",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

function HudTitle({ children }: { children: ReactNode }) {
  return (
    <h3
      className={[
        nameBebas.className,
        "text-[18px] font-bold uppercase leading-none text-white md:text-[20px]",
      ].join(" ")}
      style={matchCardTeamNameStyle(true)}
    >
      {children}
    </h3>
  );
}

function HudIntro({ children }: { children: ReactNode }) {
  const { compact } = useScoringRulesUi();
  return (
    <p
      className={[
        "leading-relaxed text-white/55",
        compact ? "text-[12px]" : "text-[13px]",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

function HudRow({
  label,
  pts,
  hint,
  tone = "default",
}: {
  label: string;
  pts: string;
  hint?: string;
  tone?: "default" | "warn" | "accent";
}) {
  const { compact } = useScoringRulesUi();
  const border =
    tone === "warn"
      ? "border-rose-400/35 bg-rose-500/[0.06]"
      : tone === "accent"
        ? "border-cyan-400/28 bg-cyan-500/[0.05]"
        : "border-white/12 bg-white/[0.03]";
  const ptsColor =
    tone === "warn" ? "text-rose-300" : "text-[#FDE047]";

  return (
    <div className={["border px-3 py-2", border].join(" ")}>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={[
            nameOxanium.className,
            "min-w-0 font-extrabold uppercase tracking-[0.1em] text-white/88",
            compact ? "text-[10px]" : "text-[11px]",
          ].join(" ")}
        >
          {label}
        </span>
        <span
          className={[
            resultStatsMetricNumClass,
            "shrink-0",
            compact ? "text-[13px]" : "text-sm",
            ptsColor,
          ].join(" ")}
        >
          {pts}
        </span>
      </div>
      {hint ? (
        <p
          className={[
            "mt-1 leading-relaxed text-white/50",
            compact ? "text-[11px]" : "text-[12px]",
          ].join(" ")}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SectionStack({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}

function RowStack({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

function SectionHead({
  kicker,
  title,
  intro,
}: {
  kicker: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="mb-2.5 space-y-1">
      <HudKicker>{kicker}</HudKicker>
      <HudTitle>{title}</HudTitle>
      <HudIntro>{intro}</HudIntro>
    </div>
  );
}

function BasketballRules({ ja }: { ja: boolean }) {
  return (
    <SectionStack>
      <section>
        <SectionHead
          kicker={ja ? "試合ごとのメイン点" : "Per game"}
          title="BASE"
          intro={
            ja
              ? "勝者が当たったときだけ基本点が入ります。外すとその試合は0点です。"
              : "Base points only apply when the winner is correct. Miss it and the game is 0."
          }
        />
        <RowStack>
          <HudRow
            tone="warn"
            label={ja ? "WINNER MISS" : "WINNER MISS"}
            pts={ja ? "0点" : "0"}
            hint={
              ja
                ? "勝者を外すと連勝・アップセットのボーナスもつきません。"
                : "No streak or upset bonuses on a missed winner."
            }
          />
          <HudRow
            tone="accent"
            label="WINNER"
            pts={ja ? "+4" : "+4"}
            hint={ja ? "ホーム勝 / アウェイ勝" : "Home or away winner"}
          />
          <HudRow
            label="MARGIN"
            pts={ja ? "最大 +4" : "up to +4"}
            hint={
              ja
                ? "得失点差のズレが小さいほど高い。誤差0で満点、15以上で0点（小数あり）。"
                : "Closer margin → more points. Exact = max. Error 15+ → 0."
            }
          />
          <HudRow
            label="TOTAL"
            pts={ja ? "最大 +2" : "up to +2"}
            hint={
              ja
                ? "両チーム合計のズレが小さいほど高い。誤差0で満点、11以上で0点（小数あり）。"
                : "Combined points. Exact = max. Error 11+ → 0."
            }
          />
        </RowStack>
      </section>

      <section>
        <SectionHead
          kicker={ja ? "基本点に上乗せ" : "Added on top"}
          title="BONUS"
          intro={
            ja
              ? "基本点に加算。合計は10点を超えることがあります。"
              : "Stacked on base. Total can exceed 10."
          }
        />
        <RowStack>
          <HudRow
            tone="accent"
            label="TOP SCORER"
            pts="+2"
            hint={
              ja
                ? "最多得点者を的中（勝者予想とは別枠）。"
                : "Hit the game’s top scorer (separate from the winner pick)."
            }
          />
          <HudRow
            label="UPSET"
            pts="+2"
            hint={
              ja
                ? "市場の偏りが45%以下の側を的中した番狂わせ。"
                : "Hit the market side at 45% or below."
            }
          />
          <HudRow
            label="STREAK"
            pts="+1 / +2 / +3"
            hint={
              ja
                ? "3〜4連勝 +1 · 5〜6連勝 +2 · 7連勝以上 +3。2連勝以下は0点。"
                : "3–4 wins +1 · 5–6 +2 · 7+ +3. Two or fewer = 0."
            }
          />
        </RowStack>
      </section>

      <UpsetSection ja={ja} />
    </SectionStack>
  );
}

function FootballRules({
  ja,
  showWcGoalScorer,
  includeUpset = true,
}: {
  ja: boolean;
  showWcGoalScorer: boolean;
  includeUpset?: boolean;
}) {
  return (
    <SectionStack>
      <section>
        <SectionHead
          kicker={ja ? "試合ごとのメイン点" : "Per game"}
          title="BASE"
          intro={
            ja
              ? "採点スコアは規定時間＋延長（PKの本数は含みません）。勝者が外れると基本点は0点です。"
              : "Line score is regulation + extra time (no penalty shootout goals). Miss the winner and base is 0."
          }
        />
        <RowStack>
          <HudRow
            tone="warn"
            label="WINNER MISS"
            pts={ja ? "0点" : "0"}
            hint={
              showWcGoalScorer
                ? ja
                  ? "得点者ボーナスは別枠で加点あり。"
                  : "Goal-scorer bonus can still apply."
                : ja
                  ? "ボーナスもつきません。"
                  : "No bonuses either."
            }
          />
          <HudRow tone="accent" label="WINNER" pts="+4" />
          <HudRow
            label="HOME"
            pts="+2"
            hint={ja ? "ホーム得点が完全一致。" : "Exact home goals."}
          />
          <HudRow
            label="AWAY"
            pts="+2"
            hint={ja ? "アウェイ得点が完全一致。" : "Exact away goals."}
          />
          <HudRow
            label="MARGIN"
            pts="+2"
            hint={
              ja
                ? "得失点差が完全一致。例）1–1 vs 0–0 は引き分け+4と差+2で基本6点。"
                : "Exact goal difference. e.g. 1–1 vs 0–0 → draw +4 and margin +2 = base 6."
            }
          />
        </RowStack>
      </section>

      <section>
        <SectionHead
          kicker={ja ? "基本点に上乗せ" : "Added on top"}
          title="BONUS"
          intro={ja ? "基本点に加算します。" : "Stacked on base points."}
        />
        <RowStack>
          {showWcGoalScorer ? (
            <HudRow
              tone="accent"
              label="GOAL SCORER"
              pts="+2"
              hint={
                ja
                  ? "ゴールする選手を1人的中（オウンゴール除く。勝者予想とは別枠）。"
                  : "Pick one scorer. Own goals excluded. Separate from winner."
              }
            />
          ) : null}
          <HudRow
            label="UPSET"
            pts="+2"
            hint={
              ja
                ? "市場の偏りが45%以下の側を的中した番狂わせ。"
                : "Hit the market side at 45% or below."
            }
          />
          <HudRow
            label="STREAK"
            pts="+1 / +2 / +3"
            hint={
              ja
                ? "3〜4連勝 +1 · 5〜6連勝 +2 · 7連勝以上 +3。2連勝以下は0点。"
                : "3–4 wins +1 · 5–6 +2 · 7+ +3. Two or fewer = 0."
            }
          />
        </RowStack>
      </section>

      {includeUpset ? <UpsetSection ja={ja} /> : null}
    </SectionStack>
  );
}

function UpsetSection({ ja }: { ja: boolean }) {
  return (
    <section>
      <SectionHead
        kicker={ja ? "別指標" : "Separate metric"}
        title="UPSET PTS"
        intro={
          ja
            ? "総合得点の UPSET +2 とは別。少数派を当てたときの加点です。"
            : "Separate from the +2 upset bonus on total score."
        }
      />
      <RowStack>
        <HudRow
          tone="accent"
          label="HIT"
          pts={ja ? "条件達成で加算" : "if hit"}
          hint={
            ja
              ? "市場45%以下の少数派を的中したとき。"
              : "Minority side at 45% or below, and you hit it."
          }
        />
        <HudRow
          label="SCALE"
          pts="0 → 10"
          hint={
            ja
              ? "多数派が55%未満は0点。55〜90%は支持率に応じて加点。90%以上は10点。"
              : "Majority under 55% → 0. 55–90% scales up. 90%+ → 10."
          }
        />
      </RowStack>
    </section>
  );
}

/** サッカー総合得点ルールのみ（採点変更モーダル等） */
export function FootballTotalScoreRulesOnly({
  language,
  showWcGoalScorer = false,
}: {
  language: Language;
  showWcGoalScorer?: boolean;
}) {
  return (
    <FootballRules
      ja={language !== "en"}
      showWcGoalScorer={showWcGoalScorer}
      includeUpset={false}
    />
  );
}

/** 予想フォームの採点ルールチップ用（総合得点＋アップセット得点） */
export function PredictionScoringFullRulesBody({
  sport,
  language,
  league,
}: {
  sport: ScoringSport;
  language: Language;
  league?: string;
}) {
  const ja = language !== "en";
  const showWcGoalScorer = String(league ?? "").toLowerCase() === "wc";

  return sport === "football" ? (
    <FootballRules ja={ja} showWcGoalScorer={showWcGoalScorer} />
  ) : (
    <BasketballRules ja={ja} />
  );
}
