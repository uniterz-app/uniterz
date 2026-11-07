import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLiveGameStats } from "../../../../../../lib/games/useLiveGameStats";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { getCachedGameDocForResult } from "../../../../../../lib/result/resultDetailFirestoreCache";
import { db } from "../../../lib/firebase";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import ProfileBackEdgeHandleNative from "../../profile/ProfileBackEdgeHandleNative";
import LiveGameStatsPanelNative from "./LiveGameStatsPanelNative";

const OXANIUM = "Oxanium_700Bold";

async function loadGameDocForLiveStats(
  gameId: string
): Promise<Record<string, unknown> | null> {
  const { exists, data } = await getCachedGameDocForResult(gameId, db);
  if (!exists || !data) return null;
  return { id: gameId, ...data };
}

type Props = {
  gameId: string;
  language: string;
  onClose: () => void;
  onOpenTeamDetail?: (teamId: string) => void;
  onOpenPlayerDetail?: (playerId: string) => void;
};

export default function NbaGameBoxScoreModalNative({
  gameId,
  language,
  onClose,
  onOpenTeamDetail,
  onOpenPlayerDetail,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const { report, loading } = useLiveGameStats(gameId, true, {
    apiBaseUrl: getUniterzApiBaseUrl(),
    loadGameDoc: loadGameDocForLiveStats,
  });
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>BOX SCORE</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {loading && !report ? (
            <Text style={styles.empty}>
              {L(lang, {
                ja: "読み込み中…",
                en: "Loading…",
                ko: "불러오는 중…",
                zh: "加载中…",
                es: "Cargando…",
                pt: "Carregando…",
                fr: "Chargement…",
              })}
            </Text>
          ) : report ? (
            <LiveGameStatsPanelNative
              report={report}
              language={language}
              onOpenTeamDetail={onOpenTeamDetail}
              onOpenPlayerDetail={onOpenPlayerDetail}
            />
          ) : (
            <Text style={styles.empty}>
              {L(lang, {
                ja: "ボックススコアがありません",
                en: "No box score yet",
                ko: "박스스코어가 없습니다",
                zh: "暂无技术统计",
                es: "Aún no hay box score",
                pt: "Ainda sem box score",
                fr: "Pas encore de box score",
              })}
            </Text>
          )}
        </ScrollView>
        <ProfileBackEdgeHandleNative onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050508",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingTop: 54,
    paddingBottom: 12,
  },
  title: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  scroll: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 40,
  },
  empty: {
    marginTop: 24,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
  },
});
