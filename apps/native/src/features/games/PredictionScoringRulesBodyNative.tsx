/** Web `predictionScoringRules` の basketball 版本体（総合得点 / アップセット得点） */
import { StyleSheet, Text, View } from "react-native";
import type { GamesLanguage } from "./gamesI18n";

const CYAN = "rgba(103,232,249,0.95)";
const YELLOW = "#fde047";
const ROSE = "rgba(253,164,175,0.85)";

function Em({ children }: { children: React.ReactNode }) {
  return <Text style={styles.em}>{children}</Text>;
}
function Num({ children }: { children: React.ReactNode }) {
  return <Text style={styles.num}>{children}</Text>;
}
function Zero({ children }: { children: React.ReactNode }) {
  return <Text style={styles.zero}>{children}</Text>;
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionIntro}>{intro}</Text>
      <View style={styles.blockList}>{children}</View>
    </View>
  );
}

function WarnBlock({ children }: { children: React.ReactNode }) {
  return <View style={[styles.block, styles.warnBlock]}>{children}</View>;
}
function HighlightBlock({ children }: { children: React.ReactNode }) {
  return <View style={[styles.block, styles.highlightBlock]}>{children}</View>;
}
function RuleBlock({ children }: { children: React.ReactNode }) {
  return <View style={styles.block}>{children}</View>;
}
function Subhead({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subhead}>{children}</Text>;
}
function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}
function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

function BasketballBodyJa() {
  return (
    <>
      <Section
        title="総合得点"
        intro="リザルトやランキングで使う、試合ごとのメインのポイントです。"
      >
        <WarnBlock>
          <Body>
            <Em>勝者予想が外れた試合</Em>は <Zero>0点</Zero>。連勝・アップセットのボーナスもつきません。
          </Body>
        </WarnBlock>
        <HighlightBlock>
          <Subhead>勝者が合っているとき（基本点・最大10点）</Subhead>
          <Body>1. <Em>勝者</Em> … <Num>+4点</Num></Body>
          <Body>
            2. <Em>得失点差</Em> … 最大 <Num>+4点</Num>（差のズレが大きいほど減点／ズレ15以上は0点）
          </Body>
          <Body>
            3. <Em>合計得点</Em> … 最大 <Num>+2点</Num>（合計が近いほど高得点）
          </Body>
        </HighlightBlock>
        <RuleBlock>
          <Subhead>ボーナス（基本点に上乗せ）</Subhead>
          <Body>
            <Em>アップセットボーナス</Em> … <Num>+2点</Num>（市場 <Num>45%以下</Num> の側を的中）
          </Body>
          <Body>
            <Em>連勝ボーナス</Em> … 3〜4連勝 <Num>+1</Num> / 5〜6連勝 <Num>+2</Num> / 7連勝以上 <Num>+3</Num>
          </Body>
          <Muted>2連勝以下は0点</Muted>
        </RuleBlock>
        <RuleBlock>
          <Body>
            <Em>総合得点</Em> ＝ 基本点 ＋ ボーナス（<Num>10点超</Num> になることもあります）
          </Body>
        </RuleBlock>
      </Section>

      <Section
        title="アップセット得点"
        intro="波乱した試合で、少数派予想が当たったときの加点です。"
      >
        <HighlightBlock>
          <Subhead>① 条件</Subhead>
          <Body>
            予想が<Em>少数派</Em>（市場 <Num>45%以下</Num>）かつ<Em>的中</Em>で加算。
          </Body>
        </HighlightBlock>
        <HighlightBlock>
          <Subhead>② 点数</Subhead>
          <Body>多数派 <Num>55%未満</Num> … <Num>0点</Num></Body>
          <Body><Num>55%以上〜90%未満</Num> … 支持率が高いほど加点</Body>
          <Body>多数派 <Num>90%以上</Num> … <Num>10点</Num></Body>
        </HighlightBlock>
        <RuleBlock>
          <Body>
            同条件で総合得点には別途 <Num>+2点</Num> のUPSETボーナスも付きます。
          </Body>
        </RuleBlock>
      </Section>
    </>
  );
}

function BasketballBodyEn() {
  return (
    <>
      <Section
        title="Total score"
        intro="Main points per game on results and leaderboards."
      >
        <WarnBlock>
          <Body>
            Wrong <Em>winner</Em> → <Zero>0</Zero> for that game (no streak or upset bonuses).
          </Body>
        </WarnBlock>
        <HighlightBlock>
          <Subhead>When the winner is correct (base, max 10)</Subhead>
          <Body>1. <Em>Winner</Em> … <Num>+4</Num></Body>
          <Body>2. <Em>Point margin</Em> … up to <Num>+4</Num> (closer → more; error ≥15 → 0)</Body>
          <Body>3. <Em>Combined total</Em> … up to <Num>+2</Num></Body>
        </HighlightBlock>
        <RuleBlock>
          <Subhead>Bonuses (added on top)</Subhead>
          <Body>
            <Em>Upset bonus</Em> … <Num>+2</Num> (correct pick on <Num>45% or below</Num> side)
          </Body>
          <Body>
            <Em>Win-streak</Em> … 3–4 <Num>+1</Num> / 5–6 <Num>+2</Num> / 7+ <Num>+3</Num>
          </Body>
          <Muted>0 at 2 wins or below</Muted>
        </RuleBlock>
        <RuleBlock>
          <Body>
            <Em>Total score</Em> = base + bonuses (can exceed <Num>10</Num>)
          </Body>
        </RuleBlock>
      </Section>

      <Section
        title="Upset points"
        intro="When an upset happens and your minority pick wins."
      >
        <HighlightBlock>
          <Subhead>① When you earn upset points</Subhead>
          <Body>
            Minority side (<Num>45% or below</Num>) + <Em>hit</Em>.
          </Body>
        </HighlightBlock>
        <HighlightBlock>
          <Subhead>② How many points</Subhead>
          <Body>Majority <Num>&lt;55%</Num> … <Num>0</Num></Body>
          <Body><Num>55–90%</Num> … scales up with share</Body>
          <Body>Majority <Num>90%+</Num> … <Num>10</Num></Body>
        </HighlightBlock>
        <RuleBlock>
          <Body>
            The same hit also adds <Num>+2</Num> upset bonus to total score.
          </Body>
        </RuleBlock>
      </Section>
    </>
  );
}

export default function PredictionScoringRulesBodyNative({
  language,
}: {
  language: GamesLanguage;
}) {
  return (
    <View style={styles.wrap}>
      {language === "en" ? <BasketballBodyEn /> : <BasketballBodyJa />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  section: { gap: 6 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
  },
  sectionIntro: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.55)",
  },
  blockList: { gap: 8 },
  block: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 3,
  },
  warnBlock: {
    borderColor: "rgba(244,63,94,0.15)",
    backgroundColor: "rgba(244,63,94,0.06)",
  },
  highlightBlock: {
    backgroundColor: "rgba(34,211,238,0.06)",
  },
  subhead: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.75)",
  },
  muted: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.55)",
  },
  em: {
    fontWeight: "700",
    color: CYAN,
  },
  num: {
    fontWeight: "700",
    color: YELLOW,
    fontVariant: ["tabular-nums"],
  },
  zero: {
    fontWeight: "700",
    color: ROSE,
    fontVariant: ["tabular-nums"],
  },
});
