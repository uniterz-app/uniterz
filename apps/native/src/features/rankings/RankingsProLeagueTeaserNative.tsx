/**
 * Web `RankingsProLeagueTeaser` 相当 — ダミー一覧ぼかし + 説明モーダル。
 */

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { buildProLeagueTeaserRows } from "../../../../../lib/rankings/proLeagueTeaserMocks";
import { PRO_LEAGUE_ATMOSPHERE } from "../../../../../lib/rankings/proLeagueAtmosphere";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import { RankingListCardNative } from "./RankingsRankingCards";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";

export function RankingsProLeagueTeaserNative({
  language,
  onPressSubscribe,
  onBackToPickUp,
}: {
  language: RankingsLanguage;
  onPressSubscribe: () => void;
  onBackToPickUp?: () => void;
}) {
  const t = rankingsTexts(language);
  const rows = useMemo(() => buildProLeagueTeaserRows(), []);
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    setModalOpen(true);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.blurHost} pointerEvents="none">
        <View style={styles.listPad}>
          {rows.map((r, i) => (
            <RankingListCardNative
              key={r.uid}
              row={r}
              rank={i + 1}
              metric="totalScore"
              language={language}
            />
          ))}
        </View>
        <BlurView
          intensity={28}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          {...nativeBlurViewExtraProps()}
        />
        <View style={styles.veil} pointerEvents="none" />
      </View>

      {!modalOpen ? (
        <View style={styles.bottomCtaWrap} pointerEvents="box-none">
          <Pressable
            onPress={onPressSubscribe}
            style={styles.cta}
            accessibilityRole="button"
          >
            <Text style={styles.ctaLabel}>{t.divisionOpenCta}</Text>
          </Pressable>
          {onBackToPickUp ? (
            <Pressable onPress={onBackToPickUp} hitSlop={8}>
              <Text style={styles.backLink}>{t.divisionOpenBackToPickUp}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalOpen(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.lockEyebrow}>PRO ONLY</Text>
            <Text style={styles.lockTitle}>{t.divisionOpenTitle}</Text>
            <Text style={styles.lockBody}>{t.divisionOpenLockBody}</Text>
            <Pressable
              onPress={onPressSubscribe}
              style={styles.cta}
              accessibilityRole="button"
            >
              <Text style={styles.ctaLabel}>{t.divisionOpenCta}</Text>
            </Pressable>
            <Pressable onPress={() => setModalOpen(false)} hitSlop={8}>
              <Text style={styles.dismiss}>{t.divisionOpenModalDismiss}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 420,
    position: "relative",
  },
  blurHost: {
    overflow: "hidden",
    borderRadius: 2,
  },
  listPad: {
    paddingHorizontal: 2,
    opacity: 0.92,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,5,15,0.35)",
  },
  bottomCtaWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    alignItems: "center",
    gap: 10,
    zIndex: 5,
  },
  cta: {
    alignSelf: "stretch",
    backgroundColor: PRO_LEAGUE_ATMOSPHERE.gold,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: "center",
  },
  ctaLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: PRO_LEAGUE_ATMOSPHERE.ink,
  },
  backLink: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    textDecorationLine: "underline",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    borderWidth: 1,
    borderColor: PRO_LEAGUE_ATMOSPHERE.panelBorder,
    backgroundColor: "rgba(12,7,22,0.96)",
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  lockEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.4,
    color: PRO_LEAGUE_ATMOSPHERE.gold,
  },
  lockTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#fff",
    textAlign: "center",
  },
  lockBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  dismiss: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
});
