import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";
import type { RankingRowWithCountry } from "../../../../../app/component/rankings/_data/mockRows";
import { getCountryCode } from "../../../../../lib/rankings/country";
import { metricNum } from "../../../../../lib/rankings/metric";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { RankingsAvatarNative } from "./RankingsAvatarAndTabs";
import { RankDeltaBadgeNative } from "./RankingsRankDeltaBadge";
import {
  FadedFlagRanking,
  listCardTone,
  listMedal,
  MonoCornerFrameNative,
  podiumMedal,
  PodiumCornerFrameNative,
  podiumScoreSubText,
  RankingsShellGridOverlay,
} from "./rankingsUiDecorations";
import { rankingsUiStyles as styles } from "./rankingsUiStyles";

function RankingRowCard({
  row,
  rank,
  metric,
  language,
  podium = false,
  onPress,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  language: RankingsLanguage;
  podium?: boolean;
  onPress?: () => void;
}) {
  const t = rankingsTexts(language);
  const isTop3 = podium;
  const m = isTop3 ? podiumMedal(rank as 1 | 2 | 3) : null;
  const lm = listMedal(rank);
  const ct = listCardTone(rank);

  const tone =
    isTop3 && m ? { border: m.ring, rank: m.solid } : { border: ct.border, rank: lm.text };

  const countryCode = getCountryCode(row);
  const { n } = metricNum(row, metric);
  const mainDisplay =
    metric === "winRate"
      ? `${Math.round(n)}`
      : metric === "streak"
        ? `${Math.round(n)}`
        : formatMetricDecimals(n, 1);
  /** Web: `TopPodium` は副行あり、`RankingCard`（4位以下）は副行なし */
  const subLine = isTop3 ? podiumScoreSubText(row, metric, language) : "";

  const scoreColor = isTop3 && m ? m.solid : "rgba(255,255,255,0.9)";

  const rankNumSize = isTop3
    ? rank === 1
      ? 26
      : rank === 2
        ? 22
        : 20
    : 20;
  const scoreMainSize = isTop3
    ? rank === 1
      ? 25
      : rank === 2
        ? 21
        : 18
    : 20;
  const scoreSuffixSize = isTop3 ? (rank === 1 ? 10 : 9) : 9;

  const cardColors = isTop3
    ? (["rgba(255,255,255,0.10)", "rgba(255,255,255,0.045)", "rgba(8,13,24,0.86)"] as const)
    : (["rgba(255,255,255,0.095)", "rgba(255,255,255,0.04)", "rgba(8,13,24,0.88)"] as const);

  const cardLocations = isTop3 ? ([0, 0.42, 1] as const) : ([0, 0.44, 1] as const);
  const cardStart = isTop3 ? ({ x: 0.08, y: 0 } as const) : ({ x: 0.15, y: 0 } as const);
  const cardEnd = isTop3 ? ({ x: 0.92, y: 1 } as const) : ({ x: 0.9, y: 1 } as const);

  const iosListGlow =
    !isTop3 && Platform.OS === "ios"
      ? {
          shadowColor: ct.outerGlow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.95,
          shadowRadius: 14,
        }
      : {};
  const androidListElev = !isTop3 && Platform.OS === "android" ? { elevation: 3 } : {};

  const iosPodiumShadow =
    isTop3 && m && Platform.OS === "ios"
      ? {
          shadowColor: m.ring,
          shadowOffset: { width: 0, height: rank === 1 ? 12 : rank === 2 ? 10 : 8 },
          shadowOpacity: 0.38,
          shadowRadius: 16,
        }
      : {};
  const androidPodiumElev =
    isTop3 && Platform.OS === "android" ? { elevation: rank === 1 ? 10 : 8 } : {};

  const cardBody = (
    <View style={isTop3 ? styles.podiumCardRoot : {}}>
      {isTop3 && rank === 1 ? (
        <View style={styles.podiumCrownWrap} pointerEvents="none">
          <MaterialCommunityIcons name="crown" size={22} color="#F4C542" />
        </View>
      ) : null}
      <LinearGradient
        colors={[...cardColors]}
        locations={[...cardLocations]}
        start={cardStart}
        end={cardEnd}
        style={[
          styles.listCardOuter,
          { borderColor: tone.border },
          isTop3 ? styles.podiumCardDims : styles.listCardDims,
          iosPodiumShadow,
          androidPodiumElev,
          iosListGlow,
          androidListElev,
        ]}
      >
        {isTop3 && m ? (
          <>
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(255,255,255,0.16)",
                "rgba(255,255,255,0.06)",
                "rgba(255,255,255,0.02)",
                "rgba(255,255,255,0)",
              ]}
              locations={[0, 0.18, 0.38, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.9 }]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0)", m.tint, "rgba(0,0,0,0)"]}
              locations={[0, 0.52, 0.78, 1]}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.55 }]}
            />
            <PodiumCornerFrameNative rank={rank as 1 | 2 | 3} />
          </>
        ) : null}
        {!isTop3 ? (
          <>
            <MonoCornerFrameNative />
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(255,255,255,0.16)",
                "rgba(255,255,255,0.07)",
                "rgba(255,255,255,0.03)",
                "rgba(255,255,255,0.02)",
              ]}
              locations={[0, 0.18, 0.38, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0)", lm.tint, "rgba(0,0,0,0)"]}
              locations={[0, 0.52, 0.78, 1]}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={[StyleSheet.absoluteFillObject, { zIndex: 1, opacity: 0.55 }]}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                top: 0,
                height: 1,
                zIndex: 2,
                backgroundColor: "rgba(255,255,255,0.23)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: "-12%",
                top: 0,
                height: "65%",
                width: "58%",
                zIndex: 1,
                opacity: 0.38,
                transform: [{ skewX: "-18deg" }],
                backgroundColor: "rgba(255,255,255,0.14)",
              }}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.1)"]}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "38%",
                zIndex: 1,
              }}
            />
          </>
        ) : null}
        <RankingsShellGridOverlay borderRadius={0} />
        <FadedFlagRanking rank={rank} countryCode={countryCode} podium={isTop3} />
        <View
          style={[
            styles.listCardForeground,
            {
              paddingVertical: isTop3 ? 10 : 10,
              paddingHorizontal: isTop3 ? 12 : 10,
            },
          ]}
        >
          <Text
            style={[
              styles.listRank,
              {
                color: tone.rank,
                fontSize: rankNumSize,
                width: isTop3 ? 28 : 32,
                marginTop: isTop3 ? 6 : 0,
              },
            ]}
          >
            {rank}
          </Text>
          <View style={isTop3 ? { marginTop: 6 } : undefined}>
            <RankingsAvatarNative
              photoURL={row.photoURL}
              label={row.displayName || row.handle}
              size={isTop3 ? 42 : 36}
            />
          </View>
          <View style={styles.listMain}>
            <View style={styles.listNameRow}>
              <Text
                style={[styles.listName, isTop3 ? styles.listNamePodium : null]}
                numberOfLines={1}
              >
                {row.displayName || row.handle || "Unknown"}
              </Text>
              <RankDeltaBadgeNative delta={row.rankDeltaPlaces} />
              {row.plan === "pro" ? <Text style={styles.proBadge}>PRO</Text> : null}
            </View>
          </View>
          <View
            style={[
              styles.listValueOuter,
              isTop3 ? styles.listValueOuterPodium : null,
              isTop3 ? { marginTop: 6 } : null,
            ]}
          >
            <View style={[styles.listValueCol, isTop3 ? styles.listValueColPodium : null]}>
              <View style={[styles.listScoreRow, isTop3 ? styles.listScoreRowPodium : null]}>
                <Text
                  style={[
                    styles.listScoreMain,
                    { fontSize: scoreMainSize, color: scoreColor },
                  ]}
                >
                  {mainDisplay}
                </Text>
                {metric === "winRate" ? (
                  <Text style={[styles.listScoreSuffix, { fontSize: scoreSuffixSize, color: scoreColor }]}>
                    %
                  </Text>
                ) : metric === "streak" ? (
                  <Text style={[styles.listScoreSuffix, { fontSize: scoreSuffixSize, color: scoreColor }]}>
                    {t.streakShort}
                  </Text>
                ) : (
                  <Text style={[styles.listScoreSuffix, { fontSize: scoreSuffixSize, color: scoreColor }]}>
                    {t.pts}
                  </Text>
                )}
              </View>
              {subLine ? (
                <Text style={[styles.listSubRight, isTop3 && styles.listSubRightPodium]} numberOfLines={2}>
                  {subLine}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {cardBody}
      </Pressable>
    );
  }
  return cardBody;
}

export function RankingsTopPodiumNative({
  rows,
  metric,
  language,
  onPressProfile,
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  language: RankingsLanguage;
  onPressProfile?: (row: RankingRowWithCountry) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.podiumWrap}>
      {rows.slice(0, 3).map((row, index) => (
        <RankingRowCard
          key={row.uid}
          row={row}
          rank={index + 1}
          metric={metric}
          language={language}
          podium
          onPress={onPressProfile ? () => onPressProfile(row) : undefined}
        />
      ))}
    </View>
  );
}

export function RankingListCardNative({
  row,
  rank,
  metric,
  language,
  onPress,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  language: RankingsLanguage;
  onPress?: () => void;
}) {
  return (
    <RankingRowCard
      row={row}
      rank={rank}
      metric={metric}
      language={language}
      onPress={onPress}
    />
  );
}
