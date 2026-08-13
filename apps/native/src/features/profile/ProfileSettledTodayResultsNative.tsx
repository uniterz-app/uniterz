/**
 * Web `ProfileSettledTodayResults` 相当（Result Drop）。
 * カード本体はリザルト一覧と同じ `ResultPostCardNative`。
 * 本日確定が空でもデザイン確認できるようプレビューカードを出す。
 */
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import type { MainTabParamList } from "../../navigation/types";
import ResultPostCardNative from "../results/ResultPostCardNative";
import ProfileOverviewChartCardNative from "./ProfileOverviewChartCardNative";
import { NATIVE_SETTLED_TODAY_MAX } from "./loadProfileSettledTodayNative";
import {
  profileOverviewChartSubtitleStyle,
  profileOverviewChartTitleStyle,
} from "./profileOverviewChartShell";
import {
  buildSettledTodayDesignPreviewPosts,
  isSettledTodayDesignPreviewPost,
} from "./settledTodayDesignPreviewNative";
import {
  resolveResultPostGameMarket,
  useResultPostsGameMarkets,
} from "../../../../../lib/games/useResultPostsGameMarkets";
import { useNativeProfileSettledTodayResults } from "./useNativeProfileSettledTodayResults";

type Props = {
  uid: string | null | undefined;
  language: "ja" | "en";
  profileStatsContext: ProfileStatsStreakContext;
  /**
   * true（既定）: 本日確定が空でもデザイン確認用モックを表示。
   * 実データがあるときは実データを優先。
   */
  showDesignPreviewWhenEmpty?: boolean;
};

export default function ProfileSettledTodayResultsNative({
  uid,
  language,
  profileStatsContext,
  showDesignPreviewWhenEmpty = false,
}: Props) {
  const isJa = language === "ja";
  const navigation = useNavigation();
  const nowMs = Date.now();
  const { posts, loading } = useNativeProfileSettledTodayResults(
    uid,
    profileStatsContext,
    !!uid
  );

  const title = "Result Drop";
  const subtitle = isJa
    ? "今日確定した分析一覧"
    : "Today's finalized analyses";
  const empty = isJa
    ? "今日確定した分析はまだありません"
    : "No analyses finalized today yet";

  const { visiblePosts, isDesignPreview } = useMemo(() => {
    if (posts.length > 0) {
      return {
        visiblePosts: posts.slice(0, NATIVE_SETTLED_TODAY_MAX),
        isDesignPreview: false,
      };
    }
    if (showDesignPreviewWhenEmpty && !loading) {
      return {
        visiblePosts: buildSettledTodayDesignPreviewPosts(),
        isDesignPreview: true,
      };
    }
    return { visiblePosts: [], isDesignPreview: false };
  }, [loading, posts, showDesignPreviewWhenEmpty]);

  const marketsFromGames = useResultPostsGameMarkets(visiblePosts);

  const openPost = (postId: string) => {
    if (isSettledTodayDesignPreviewPost(postId)) return;
    const tabNav = (navigation.getParent?.() ??
      navigation) as BottomTabNavigationProp<MainTabParamList>;
    tabNav.navigate("ResultTab", {
      screen: "ResultDetail",
      params: { postId },
    });
  };

  return (
    <View style={styles.stretch}>
    <ProfileOverviewChartCardNative style={styles.card}>
      <View>
        <Text style={profileOverviewChartTitleStyle}>{title}</Text>
        <Text style={[profileOverviewChartSubtitleStyle, styles.subtitle]}>
          {subtitle}
        </Text>
      </View>

      {isDesignPreview ? (
        <View style={styles.previewBanner}>
          <Text style={styles.previewBannerText}>
            {isJa
              ? "デザインプレビュー（本日確定なし）"
              : "Design preview (none settled today)"}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <BlocksPulseLoader pixelScale={0.85} />
        </View>
      ) : visiblePosts.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        <View style={styles.list}>
          {visiblePosts.map((post, index) => (
            <ResultPostCardNative
              key={post.id}
              post={post}
              language={language}
              nowMs={nowMs}
              viewerUid={null}
              listEnterIndex={index}
              entranceEnabled={false}
              compactSpacing
              gameMarket={resolveResultPostGameMarket(post, marketsFromGames)}
              onOpenDetail={openPost}
            />
          ))}
        </View>
      )}
    </ProfileOverviewChartCardNative>
    </View>
  );
}

const styles = StyleSheet.create({
  stretch: {
    alignSelf: "stretch",
    width: "100%",
  },
  card: {
    alignSelf: "stretch",
    width: "100%",
    padding: 12,
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 520,
  },
  previewBanner: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  previewBannerText: {
    color: "rgba(0,245,255,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  loadingWrap: {
    marginTop: 16,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    marginTop: 16,
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
});
