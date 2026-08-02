/**
 * Web `/dev/my-rank-free-pro-preview` 相当 + ランキングページ見た目のモック。
 * My Rank カードとリストを本番レイアウトに近い形で確認する。
 */
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { MyRankMiniMetric } from "../../../../../app/component/rankings/MyRankCard";
import type {
  MobileMetric,
  RankingRowWithCountry,
} from "../../../../../lib/rankings/rankingMetrics";
import {
  buildRankTierGapHint,
  mockCutoffTotalPointsAtRank,
  resolveNextRankTierMilestone,
} from "../../../../../lib/rankings/rankTierMilestone";
import { buildMockMyRankProgressPoints } from "../../../../../lib/rankings/myRankRankingProgress";
import { MyRankCardNative } from "./RankingsMyRankCardNative";
import {
  RankingListCardNative,
  RankingsTopPodiumNative,
} from "./RankingsRankingCards";
import { RankingsMetricRowNative } from "./RankingsMetricRowNative";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";

const METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "upsetScore",
  "goalScorerHits",
];

const MOCK_MINI: MyRankMiniMetric[] = [
  {
    key: "totalScore",
    label: "totalPTS",
    value: "1,284",
    pct: 82,
    dayDelta: "+12",
  },
  {
    key: "winRate",
    label: "WIN%",
    value: "68",
    pct: 68,
    dayDelta: "+2",
  },
  {
    key: "upsetScore",
    label: "UPSET",
    value: "96.5",
    pct: 61,
    dayDelta: "-1.2",
  },
  {
    key: "goalScorerHits",
    label: "SCORER",
    value: "18",
    pct: 55,
    dayDelta: "+1",
  },
];

const FREE_FEATURES = [
  "順位の上に YOUR RANK",
  "ランキングリスト行と同じ見た目（左ライン・四隅なし）",
  "Ranking Progress なし",
];

const PRO_FEATURES = [
  "上段: ユーザー | 順位+スタッツ / 下段: Progress",
  "順位は #56 + 母数 + TOP%（YOUR RANK なし）",
  "スタッツは数字 · 差分 · 次帯差 · VOL/AVG / Progress は総合のみ",
];

const RANK_PRESETS = [
  { rank: 120, label: "120位" },
  { rank: 80, label: "80位" },
  { rank: 48, label: "48位" },
  { rank: 14, label: "14位" },
  { rank: 8, label: "8位" },
] as const;

const MOCK_NAMES = [
  "Nova",
  "Kaito",
  "Mira",
  "Juno",
  "Rex",
  "Aoi",
  "Sena",
  "Yuki",
  "Leo",
  "Hana",
  "Ken",
  "Rin",
] as const;

const MOCK_MY_TOTAL_POINTS = 1284;
const MOCK_TOTAL_ENTRIES = 1530;
const ME_UID = "mock-me";

function buildMockListRows(myRank: number): RankingRowWithCountry[] {
  const rows: RankingRowWithCountry[] = [];
  const listSize = 12;
  for (let i = 0; i < listSize; i++) {
    const place = i + 1;
    const isMe = place === Math.min(Math.max(1, myRank), listSize);
    const pts = Math.max(200, MOCK_MY_TOTAL_POINTS + (myRank - place) * 18);
    const posts = 28 + ((place * 3) % 17);
    rows.push({
      uid: isMe ? ME_UID : `mock-${place}`,
      handle: isMe ? "rikuto" : `user${place}`,
      displayName: isMe ? "Rikuto" : MOCK_NAMES[i]!,
      photoURL: undefined,
      plan: place <= 3 || isMe ? "pro" : "free",
      posts,
      winRate: Math.min(0.92, 0.42 + (listSize - place) * 0.035),
      streak: Math.max(0, 8 - (place % 7)),
      totalScore: pts,
      avgTotalScore: pts / posts,
      upsetScore: Math.max(10, 120 - place * 4.2),
      avgUpsetScore: Math.max(1, (120 - place * 4.2) / posts),
      goalScorerHits: Math.max(0, 24 - place),
      countryCode: isMe ? "JP" : place % 3 === 0 ? "US" : place % 2 === 0 ? "KR" : "JP",
      rankDeltaPlaces: place === 1 ? 2 : place % 4 === 0 ? -1 : place % 3 === 0 ? 1 : 0,
      metricValueDelta: place % 2 === 0 ? 4.2 : -1.5,
    });
  }

  // myRank が 12 より下のときは末尾を自分に差し替え
  if (myRank > listSize) {
    const last = rows[listSize - 1]!;
    rows[listSize - 1] = {
      ...last,
      uid: ME_UID,
      handle: "rikuto",
      displayName: "Rikuto",
      plan: "pro",
      totalScore: MOCK_MY_TOTAL_POINTS,
      avgTotalScore: MOCK_MY_TOTAL_POINTS / 41,
      posts: 41,
      countryCode: "JP",
      rankDeltaPlaces: 3,
      metricValueDelta: 12,
    };
  }

  return rows;
}

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function MyRankFreeProPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language !== "en";
  const lang = (language === "en" ? "en" : "ja") as "ja" | "en";
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const [rank, setRank] = useState(48);
  const [tier, setTier] = useState<"free" | "pro">("pro");

  const rankTierGap = useMemo(() => {
    const target = resolveNextRankTierMilestone(rank);
    const cutoffRows =
      target != null
        ? [{ rank: target, totalPoints: mockCutoffTotalPointsAtRank(target) }]
        : undefined;
    return buildRankTierGapHint({
      currentRank: rank,
      myTotalPoints: MOCK_MY_TOTAL_POINTS,
      cutoffRows,
    });
  }, [rank]);

  const nextMilestoneLabel = useMemo(() => {
    const target = resolveNextRankTierMilestone(rank);
    if (target == null) return isJa ? "TOP10 圏内" : "Inside TOP10";
    return isJa
      ? `${rank}位 → 次の目標 ${target}位`
      : `#${rank} → next milestone #${target}`;
  }, [isJa, rank]);

  const rankProgress = useMemo(
    () => buildMockMyRankProgressPoints(rank, 7),
    [rank]
  );

  const listRows = useMemo(() => buildMockListRows(rank), [rank]);
  const top3 = listRows.slice(0, 3);
  const restRows = listRows.slice(3);

  const metricValue =
    metric === "winRate"
      ? 68
      : metric === "totalScore"
        ? 1284
        : metric === "goalScorerHits"
          ? 18
          : 96.5;

  const cardProps = {
    rank,
    metric,
    value: metricValue,
    displayName: "Rikuto",
    photoURL: null as string | null,
    totalPosts: 41,
    loading: false,
    statsScramble: false,
    language: lang,
    rankDeltaPlaces: 3,
    totalEntries: MOCK_TOTAL_ENTRIES,
    miniMetrics: MOCK_MINI,
    cardResetKey: `${metric}:${tier}`,
    leagueLabel: "NBA",
    statsSource: {
      totalPosts: 41,
      totalPoints: 1284,
      totalPrecision: 312,
      totalUpset: 96.5,
    },
    mobileWide: true as const,
    rankProgress,
    displayTier: tier,
    isPro: tier === "pro",
    rankTierGap: tier === "pro" ? rankTierGap : null,
  };

  return (
    <MobilePageShell
      title={isJa ? "My Rank ページモック" : "My Rank page mock"}
      appBackground
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>DEV PREVIEW</Text>
        <Text style={styles.lead}>
          {isJa
            ? "本番未接続。マイランクカード＋ランキングリストの見た目確認用モック。"
            : "Mock only. My Rank card + ranking list layout preview."}
        </Text>

        <Text style={styles.sectionLabel}>TIER</Text>
        <View style={styles.chipRow}>
          {(["free", "pro"] as const).map((t) => (
            <Chip
              key={t}
              label={t.toUpperCase()}
              active={tier === t}
              onPress={() => setTier(t)}
              tone={t === "pro" ? "amber" : "cyan"}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>RANK</Text>
        <View style={styles.chipRow}>
          {RANK_PRESETS.map(({ rank: r, label }) => (
            <Chip
              key={r}
              label={label}
              active={rank === r}
              onPress={() => setRank(r)}
              tone="amber"
            />
          ))}
        </View>
        <Text style={styles.hint}>{nextMilestoneLabel}</Text>

        <Text style={styles.sectionLabel}>PAGE MOCK</Text>
        <MyRankCardNative {...cardProps} />

        <View style={styles.metricRowWrap}>
          <RankingsMetricRowNative
            metrics={METRICS}
            metric={metric}
            onChange={setMetric}
            language={lang}
          />
        </View>

        <View style={styles.listSection}>
          <RankingsTopPodiumNative
            rows={top3}
            metric={metric}
            language={lang}
            entranceKey={`mock-${metric}-${rank}`}
          />
          <View style={styles.restList}>
            {restRows.map((row, index) => {
              const listRank =
                rank > 12 && index === restRows.length - 1 ? rank : index + 4;
              return (
                <RankingListCardNative
                  key={row.uid}
                  row={row}
                  rank={listRank}
                  metric={metric}
                  language={lang}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.gapBlock} />

        <Text style={styles.sectionLabel}>FREE / PRO COMPARE</Text>
        <TierHeader
          label="Free"
          sub='displayTier="free"'
          features={FREE_FEATURES}
          muted
        />
        <MyRankCardNative
          {...cardProps}
          displayTier="free"
          isPro={false}
          rankTierGap={null}
        />

        <View style={styles.gapBlock} />

        <TierHeader
          label="Pro"
          sub='displayTier="pro" · isPro'
          features={PRO_FEATURES}
        />
        <MyRankCardNative
          {...cardProps}
          displayTier="pro"
          isPro
          rankTierGap={rankTierGap}
        />
      </ScrollView>
    </MobilePageShell>
  );
}

function Chip({
  label,
  active,
  onPress,
  tone,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone: "amber" | "cyan" | "fuchsia";
}) {
  const activeStyle =
    tone === "amber"
      ? styles.chipAmber
      : tone === "fuchsia"
        ? styles.chipFuchsia
        : styles.chipCyan;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? activeStyle : styles.chipIdle]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextOn : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function TierHeader({
  label,
  sub,
  features,
  muted = false,
}: {
  label: string;
  sub: string;
  features: string[];
  muted?: boolean;
}) {
  return (
    <View style={styles.tierHeader}>
      <View style={styles.tierTitleRow}>
        <Text style={[styles.tierLabel, muted ? styles.tierMuted : styles.tierGold]}>
          {label}
        </Text>
        <Text style={styles.tierSub}>{sub}</Text>
      </View>
      {features.map((f) => (
        <Text key={f} style={styles.featureLine}>
          · {f}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.4,
    color: "rgba(34,211,238,0.8)",
    textTransform: "uppercase",
  },
  lead: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.55)",
  },
  sectionLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.4)",
  },
  hint: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  metricRowWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  listSection: {
    marginTop: 4,
    gap: 8,
  },
  restList: {
    gap: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipIdle: {
    borderColor: "rgba(255,255,255,0.15)",
  },
  chipAmber: {
    borderColor: "rgba(251,191,36,0.5)",
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  chipCyan: {
    borderColor: "rgba(34,211,238,0.5)",
    backgroundColor: "rgba(34,211,238,0.15)",
  },
  chipFuchsia: {
    borderColor: "rgba(232,121,249,0.5)",
    backgroundColor: "rgba(232,121,249,0.15)",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },
  chipTextOn: {
    color: "rgba(255,255,255,0.95)",
  },
  gapBlock: {
    height: 28,
  },
  tierHeader: {
    marginBottom: 8,
  },
  tierTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  tierMuted: {
    color: "rgba(255,255,255,0.7)",
  },
  tierGold: {
    color: "rgba(253,230,138,0.95)",
  },
  tierSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
  },
  featureLine: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
});
