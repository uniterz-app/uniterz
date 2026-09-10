/** Web `predictionScoringRules` 相当（BASE / BONUS / UPSET PTS） */
import { StyleSheet, Text, View } from "react-native";
import {
  resolveScoringRulesLang,
  scoringRulesCopy,
  type ScoringRulesCopy,
} from "../../../../../lib/predict/scoringRulesCopy";
import type { GamesLanguage } from "./gamesI18n";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "./matchCardTypography";

type Sport = "nba" | "wc";

function HudKicker({ children }: { children: string }) {
  return <Text style={styles.kicker}>{children}</Text>;
}
function HudTitle({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}
function HudIntro({ children }: { children: string }) {
  return <Text style={styles.intro}>{children}</Text>;
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
  return (
    <View
      style={[
        styles.row,
        tone === "warn" && styles.rowWarn,
        tone === "accent" && styles.rowAccent,
      ]}
    >
      <View style={styles.rowTop}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text
          style={[styles.rowPts, tone === "warn" && styles.rowPtsWarn]}
        >
          {pts}
        </Text>
      </View>
      {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
    </View>
  );
}

function UpsetSection({ c }: { c: ScoringRulesCopy }) {
  return (
    <View style={styles.section}>
      <HudKicker>{c.separateMetric}</HudKicker>
      <HudTitle>UPSET PTS</HudTitle>
      <HudIntro>{c.upsetPtsIntro}</HudIntro>
      <HudRow tone="accent" label="HIT" pts={c.ifHit} hint={c.upsetHitHint} />
      <HudRow label="SCALE" pts="0 → 10" hint={c.upsetScaleHint} />
    </View>
  );
}

function BasketballBody({ c }: { c: ScoringRulesCopy }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.section}>
        <HudKicker>{c.perGame}</HudKicker>
        <HudTitle>BASE</HudTitle>
        <HudIntro>{c.bbBaseIntro}</HudIntro>
        <HudRow
          tone="warn"
          label="WINNER MISS"
          pts={c.pts0}
          hint={c.bbWinnerMissHint}
        />
        <HudRow tone="accent" label="WINNER" pts="+4" hint={c.bbWinnerHint} />
        <HudRow label="MARGIN" pts={c.upTo4} hint={c.bbMarginHint} />
        <HudRow label="TOTAL" pts={c.upTo2} hint={c.bbTotalHint} />
      </View>

      <View style={styles.section}>
        <HudKicker>{c.addedOnTop}</HudKicker>
        <HudTitle>BONUS</HudTitle>
        <HudIntro>{c.bbBonusIntro}</HudIntro>
        <HudRow
          tone="accent"
          label="TOP SCORER"
          pts="+2"
          hint={c.bbTopScorerHint}
        />
        <HudRow label="UPSET" pts="+2" hint={c.upsetHint} />
        <HudRow label="STREAK" pts="+1 / +2 / +3" hint={c.streakHint} />
      </View>

      <UpsetSection c={c} />
    </View>
  );
}

function FootballBody({ c }: { c: ScoringRulesCopy }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.section}>
        <HudKicker>{c.perGame}</HudKicker>
        <HudTitle>BASE</HudTitle>
        <HudIntro>{c.fbBaseIntro}</HudIntro>
        <HudRow
          tone="warn"
          label="WINNER MISS"
          pts={c.pts0}
          hint={c.fbWinnerMissHintWithScorer}
        />
        <HudRow tone="accent" label="WINNER" pts="+4" />
        <HudRow label="HOME" pts="+2" hint={c.fbHomeHint} />
        <HudRow label="AWAY" pts="+2" hint={c.fbAwayHint} />
        <HudRow label="MARGIN" pts="+2" hint={c.fbMarginHintShort} />
      </View>

      <View style={styles.section}>
        <HudKicker>{c.addedOnTop}</HudKicker>
        <HudTitle>BONUS</HudTitle>
        <HudIntro>{c.fbBonusIntro}</HudIntro>
        <HudRow
          tone="accent"
          label="GOAL SCORER"
          pts="+2"
          hint={c.fbGoalScorerHint}
        />
        <HudRow label="UPSET" pts="+2" hint={c.upsetHint} />
        <HudRow label="STREAK" pts="+1 / +2 / +3" hint={c.streakHint} />
      </View>

      <UpsetSection c={c} />
    </View>
  );
}

export default function PredictionScoringRulesBodyNative({
  language,
  league = "nba",
}: {
  language: GamesLanguage;
  league?: Sport;
}) {
  const c = scoringRulesCopy(resolveScoringRulesLang(language));
  return league === "wc" ? (
    <FootballBody c={c} />
  ) : (
    <BasketballBody c={c} />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  section: { gap: 6 },
  kicker: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  title: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "400",
    letterSpacing: 1.4,
    color: "#fff",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  intro: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 4,
  },
  row: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  rowWarn: {
    borderColor: "rgba(251,113,133,0.35)",
    backgroundColor: "rgba(244,63,94,0.06)",
  },
  rowAccent: {
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(0,245,255,0.05)",
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.88)",
  },
  rowPts: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    color: "#FDE047",
    fontVariant: ["tabular-nums"],
  },
  rowPtsWarn: {
    color: "#FDA4AF",
  },
  rowHint: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
});
