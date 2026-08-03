/**
 * Web プロフィール「アワード」タブ相当。
 * 提出済みシーズンアワード予想を表示（未提出は NO DATA）。
 */
import { StyleSheet, Text, View } from "react-native";
import NbaSeasonAwardsViewPanelNative from "../games/predict/season/NbaSeasonAwardsViewPanelNative";
import { MOCK_SUBMITTED_AWARDS } from "../../../../../lib/predict/nbaSeasonPicksViewMocks";

type Props = {
  uid: string | undefined;
  language: "ja" | "en";
  /** 提出済み予想。未指定・null は NO DATA（本番データ接続までのプレースホルダ） */
  prediction?: typeof MOCK_SUBMITTED_AWARDS | null;
  /** dev / プレビュー用にモックを出す */
  useMockWhenEmpty?: boolean;
};

export default function ProfileAwardsTabNative({
  uid,
  language,
  prediction = null,
  useMockWhenEmpty = false,
}: Props) {
  const isJa = language === "ja";

  if (!uid) {
    return (
      <Text style={styles.muted}>
        {isJa ? "ログインが必要です" : "Sign in required"}
      </Text>
    );
  }

  const resolved =
    prediction ?? (useMockWhenEmpty ? MOCK_SUBMITTED_AWARDS : null);

  if (!resolved) {
    return (
      <View style={styles.noDataBox}>
        <Text style={styles.noDataBebas}>NO DATA</Text>
        <Text style={styles.muted}>
          {isJa
            ? "提出済みのシーズンアワード予想がありません"
            : "No season awards prediction submitted"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <NbaSeasonAwardsViewPanelNative prediction={resolved} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  muted: {
    marginTop: 16,
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    textAlign: "center",
  },
  noDataBox: {
    marginTop: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    gap: 8,
  },
  noDataBebas: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 36,
    letterSpacing: 4,
    color: "rgba(255,255,255,0.55)",
  },
});
