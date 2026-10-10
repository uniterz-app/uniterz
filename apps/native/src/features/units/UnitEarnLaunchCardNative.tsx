/** Web `UnitEarnLaunchCard` 相当 — 起動時に未表示の Unit 獲得をまとめて 1 枚で見せる */
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme/tokens";
import { JP_600, JP_700 } from "../profile/reports/reportThemeNative";
import UnitCoinDiscNative from "../profile/UnitCoinDiscNative";
import {
  formatUnitEarnLaunchAmount,
  unitEarnLaunchCopy,
  type UnitEarnLaunchSummary,
} from "../../../../../lib/units/unitEarnLaunchSummary";

type Props = {
  summary: UnitEarnLaunchSummary | null;
  language?: string | null;
  onClaim: () => void;
};

export default function UnitEarnLaunchCardNative({
  summary,
  language,
  onClaim,
}: Props) {
  const copy = unitEarnLaunchCopy(language);
  const single = summary?.lines.length === 1 && summary.hiddenCount === 0;
  const head = summary?.lines[0] ?? null;

  return (
    <Modal
      visible={summary != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClaim}
    >
      <View style={styles.root}>
        <View style={styles.scrim} />
        {summary ? (
          <View style={styles.card} accessibilityViewIsModal>
            <Text style={styles.heading}>{copy.heading}</Text>

            {single && head ? (
              <View style={styles.singleMeta}>
                <Text style={styles.singleTitle} numberOfLines={2}>
                  {head.title}
                </Text>
                {head.subtitle ? (
                  <Text style={styles.singleSub} numberOfLines={2}>
                    {head.subtitle}
                  </Text>
                ) : null}
                {head.rankText ? (
                  <Text style={styles.singleRank}>{head.rankText}</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.list}>
                {summary.lines.map((line) => (
                  <View key={line.id} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {line.title}
                      </Text>
                      {line.rankText || line.subtitle ? (
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {[line.rankText, line.subtitle]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.rowAmount}>
                      {formatUnitEarnLaunchAmount(line.amount)}
                    </Text>
                  </View>
                ))}
                {summary.hiddenCount > 0 ? (
                  <Text style={styles.more}>
                    {copy.more(summary.hiddenCount)}
                  </Text>
                ) : null}
              </View>
            )}

            {!single ? <Text style={styles.totalLabel}>{copy.total}</Text> : null}
            <View style={styles.totalRow}>
              <UnitCoinDiscNative size={36} />
              <Text style={styles.totalValue}>
                {formatUnitEarnLaunchAmount(summary.total)}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.ok}
              onPress={onClaim}
              style={({ pressed }) => [
                styles.claimBtn,
                pressed ? styles.claimBtnPressed : null,
              ]}
            >
              <Text style={styles.claimBtnText}>{copy.ok}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const CYBER_CYAN = "#00F5FF";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: "#07090d",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
  },
  heading: {
    fontFamily: fonts.metricExtra,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: CYBER_CYAN,
    textAlign: "center",
  },
  singleMeta: {
    marginTop: 14,
    width: "100%",
    alignItems: "center",
  },
  singleTitle: {
    fontFamily: JP_700,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.94)",
    textAlign: "center",
  },
  singleSub: {
    marginTop: 6,
    fontFamily: JP_600,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(226,246,255,0.72)",
    textAlign: "center",
  },
  singleRank: {
    marginTop: 10,
    fontFamily: fonts.metricExtra,
    fontSize: 28,
    fontWeight: "800",
    color: "#cffafe",
    textAlign: "center",
  },
  list: {
    marginTop: 14,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
    gap: 12,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: JP_700,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  rowSub: {
    marginTop: 2,
    fontFamily: JP_600,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(226,246,255,0.6)",
  },
  rowAmount: {
    fontFamily: fonts.metricExtra,
    fontSize: 15,
    fontWeight: "800",
    color: "#ffe9a8",
  },
  more: {
    marginTop: 8,
    fontFamily: JP_600,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(226,246,255,0.55)",
    textAlign: "right",
  },
  totalLabel: {
    marginTop: 16,
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(226,246,255,0.6)",
  },
  totalRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  totalValue: {
    fontFamily: fonts.metricExtra,
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#ffe9a8",
  },
  claimBtn: {
    marginTop: 22,
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: CYBER_CYAN,
  },
  claimBtnPressed: {
    opacity: 0.85,
  },
  claimBtnText: {
    fontFamily: fonts.metricExtra,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "#041018",
  },
});
