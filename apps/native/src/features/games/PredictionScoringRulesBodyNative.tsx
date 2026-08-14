/** Web `predictionScoringRules` 相当（BASE / BONUS / UPSET PTS） */
import { StyleSheet, Text, View } from "react-native";
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

function UpsetSection({ ja }: { ja: boolean }) {
  return (
    <View style={styles.section}>
      <HudKicker>{ja ? "別指標" : "Separate metric"}</HudKicker>
      <HudTitle>UPSET PTS</HudTitle>
      <HudIntro>
        {ja
          ? "総合得点の UPSET +2 とは別。少数派を当てたときの加点です。"
          : "Separate from the +2 upset bonus on total score."}
      </HudIntro>
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
    </View>
  );
}

function BasketballBody({ ja }: { ja: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.section}>
        <HudKicker>{ja ? "試合ごとのメイン点" : "Per game"}</HudKicker>
        <HudTitle>BASE</HudTitle>
        <HudIntro>
          {ja
            ? "勝者が当たったときだけ基本点が入ります。外すとその試合は0点です。"
            : "Base points only apply when the winner is correct. Miss it and the game is 0."}
        </HudIntro>
        <HudRow
          tone="warn"
          label="WINNER MISS"
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
          pts="+4"
          hint={ja ? "ホーム勝 / アウェイ勝" : "Home or away winner"}
        />
        <HudRow
          label="MARGIN"
          pts={ja ? "最大 +4" : "up to +4"}
          hint={
            ja
              ? "得失点差のズレが小さいほど高い。誤差0で満点、15以上で0点。"
              : "Closer margin → more points. Exact = max. Error 15+ → 0."
          }
        />
        <HudRow
          label="TOTAL"
          pts={ja ? "最大 +2" : "up to +2"}
          hint={
            ja
              ? "両チーム合計のズレが小さいほど高い。誤差0で満点、11以上で0点。"
              : "Combined points. Exact = max. Error 11+ → 0."
          }
        />
      </View>

      <View style={styles.section}>
        <HudKicker>{ja ? "基本点に上乗せ" : "Added on top"}</HudKicker>
        <HudTitle>BONUS</HudTitle>
        <HudIntro>
          {ja
            ? "基本点に加算。合計は10点を超えることがあります。"
            : "Stacked on base. Total can exceed 10."}
        </HudIntro>
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
      </View>

      <UpsetSection ja={ja} />
    </View>
  );
}

function FootballBody({ ja }: { ja: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.section}>
        <HudKicker>{ja ? "試合ごとのメイン点" : "Per game"}</HudKicker>
        <HudTitle>BASE</HudTitle>
        <HudIntro>
          {ja
            ? "採点スコアは規定時間＋延長（PKの本数は含みません）。勝者が外れると基本点は0点です。"
            : "Line score is regulation + extra time (no penalty shootout goals). Miss the winner and base is 0."}
        </HudIntro>
        <HudRow
          tone="warn"
          label="WINNER MISS"
          pts={ja ? "0点" : "0"}
          hint={
            ja
              ? "得点者ボーナスは別枠で加点あり。"
              : "Goal-scorer bonus can still apply."
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
              ? "得失点差が完全一致。"
              : "Exact goal difference."
          }
        />
      </View>

      <View style={styles.section}>
        <HudKicker>{ja ? "基本点に上乗せ" : "Added on top"}</HudKicker>
        <HudTitle>BONUS</HudTitle>
        <HudIntro>{ja ? "基本点に加算します。" : "Stacked on base points."}</HudIntro>
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
      </View>

      <UpsetSection ja={ja} />
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
  const ja = language !== "en";
  return league === "wc" ? (
    <FootballBody ja={ja} />
  ) : (
    <BasketballBody ja={ja} />
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
