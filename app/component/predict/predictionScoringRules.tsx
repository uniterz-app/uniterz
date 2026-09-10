"use client";

import { createContext, useContext, type ReactNode } from "react";
import { nameBebas, nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import type { Language } from "@/lib/i18n/language";
import {
  resolveScoringRulesLang,
  scoringRulesCopy,
  type ScoringRulesCopy,
} from "@/lib/predict/scoringRulesCopy";
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

function BasketballRules({ c }: { c: ScoringRulesCopy }) {
  return (
    <SectionStack>
      <section>
        <SectionHead kicker={c.perGame} title="BASE" intro={c.bbBaseIntro} />
        <RowStack>
          <HudRow
            tone="warn"
            label="WINNER MISS"
            pts={c.pts0}
            hint={c.bbWinnerMissHint}
          />
          <HudRow
            tone="accent"
            label="WINNER"
            pts="+4"
            hint={c.bbWinnerHint}
          />
          <HudRow label="MARGIN" pts={c.upTo4} hint={c.bbMarginHint} />
          <HudRow label="TOTAL" pts={c.upTo2} hint={c.bbTotalHint} />
        </RowStack>
      </section>

      <section>
        <SectionHead kicker={c.addedOnTop} title="BONUS" intro={c.bbBonusIntro} />
        <RowStack>
          <HudRow
            tone="accent"
            label="TOP SCORER"
            pts="+2"
            hint={c.bbTopScorerHint}
          />
          <HudRow label="UPSET" pts="+2" hint={c.upsetHint} />
          <HudRow label="STREAK" pts="+1 / +2 / +3" hint={c.streakHint} />
        </RowStack>
      </section>

      <UpsetSection c={c} />
    </SectionStack>
  );
}

function FootballRules({
  c,
  showWcGoalScorer,
  includeUpset = true,
}: {
  c: ScoringRulesCopy;
  showWcGoalScorer: boolean;
  includeUpset?: boolean;
}) {
  return (
    <SectionStack>
      <section>
        <SectionHead kicker={c.perGame} title="BASE" intro={c.fbBaseIntro} />
        <RowStack>
          <HudRow
            tone="warn"
            label="WINNER MISS"
            pts={c.pts0}
            hint={
              showWcGoalScorer
                ? c.fbWinnerMissHintWithScorer
                : c.fbWinnerMissHintNoScorer
            }
          />
          <HudRow tone="accent" label="WINNER" pts="+4" />
          <HudRow label="HOME" pts="+2" hint={c.fbHomeHint} />
          <HudRow label="AWAY" pts="+2" hint={c.fbAwayHint} />
          <HudRow label="MARGIN" pts="+2" hint={c.fbMarginHint} />
        </RowStack>
      </section>

      <section>
        <SectionHead kicker={c.addedOnTop} title="BONUS" intro={c.fbBonusIntro} />
        <RowStack>
          {showWcGoalScorer ? (
            <HudRow
              tone="accent"
              label="GOAL SCORER"
              pts="+2"
              hint={c.fbGoalScorerHint}
            />
          ) : null}
          <HudRow label="UPSET" pts="+2" hint={c.upsetHint} />
          <HudRow label="STREAK" pts="+1 / +2 / +3" hint={c.streakHint} />
        </RowStack>
      </section>

      {includeUpset ? <UpsetSection c={c} /> : null}
    </SectionStack>
  );
}

function UpsetSection({ c }: { c: ScoringRulesCopy }) {
  return (
    <section>
      <SectionHead
        kicker={c.separateMetric}
        title="UPSET PTS"
        intro={c.upsetPtsIntro}
      />
      <RowStack>
        <HudRow tone="accent" label="HIT" pts={c.ifHit} hint={c.upsetHitHint} />
        <HudRow label="SCALE" pts="0 → 10" hint={c.upsetScaleHint} />
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
  const c = scoringRulesCopy(resolveScoringRulesLang(language));
  return (
    <FootballRules
      c={c}
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
  const c = scoringRulesCopy(resolveScoringRulesLang(language));
  const showWcGoalScorer = String(league ?? "").toLowerCase() === "wc";

  return sport === "football" ? (
    <FootballRules c={c} showWcGoalScorer={showWcGoalScorer} />
  ) : (
    <BasketballRules c={c} />
  );
}
