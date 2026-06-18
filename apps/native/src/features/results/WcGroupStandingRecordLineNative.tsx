import { Text, type TextStyle } from "react-native";
import type { Language } from "../../../../../lib/i18n/language";
import { MATCH_CARD_METRIC_FONT } from "../games/matchCardTypography";
import {
  formatWcGroupStageRecordLabel,
  type WcGroupStandingEntry,
} from "../../../../../lib/wc/wcGroupStandingRank";

type Props = {
  standing: WcGroupStandingEntry | null | undefined;
  language: Language;
};

/** 国旗下 — 勝敗分の横にグループ順位 */
export default function WcGroupStandingRecordLineNative({
  standing,
  language,
}: Props) {
  if (!standing) return null;
  return (
    <Text style={styles.line} numberOfLines={1}>
      {formatWcGroupStageRecordLabel(standing, language)}
    </Text>
  );
}

const styles = {
  line: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.85)",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  } satisfies TextStyle,
};
