/** Web `FirstRunSetupModal` 相当 — 新規登録直後の通知・スコア表示の確認 */
import { useEffect, useState } from "react";
import { Modal, Platform, StyleSheet, Switch, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import PredictOverlayChamferedFrameNative from "../games/PredictOverlayChamferedFrameNative";
import UniterzLogoNative from "../profile/UniterzLogoNative";
import { PREDICT_OVERLAY_CYBER_FORM_CUT } from "../games/matchListCyberClipPath";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../../ui/ModalActionButtonNative";
import { useMatchScoreDisplayPrefsNative } from "../games/useMatchScoreDisplayPrefsNative";
import {
  matchScoreDisplayCopy,
  type MatchScoreDisplayPrefKey,
} from "../../../../../lib/games/matchScoreDisplayPrefs";
import { firstRunSetupCopy } from "../../../../../lib/onboarding/firstRunSetup";

type Props = {
  open: boolean;
  uid: string | null;
  language: string;
  /** notify: 通知を受け取る（OS 許可ダイアログへ進む） */
  onStart: (opts: { notify: boolean }) => void;
};

function SettingSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: "rgba(51,65,85,0.9)", true: "rgba(6,182,212,0.55)" }}
      thumbColor={Platform.OS === "android" ? (value ? "#67e8f9" : "#94a3b8") : undefined}
    />
  );
}

export default function FirstRunSetupModalNative({ open, uid, language, onStart }: Props) {
  const t = firstRunSetupCopy(language);
  const scoreCopy = matchScoreDisplayCopy(language);
  const { prefs, updatePref } = useMatchScoreDisplayPrefsNative(uid);
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (open) setNotify(true);
  }, [open]);

  const scoreRows: Array<{ key: MatchScoreDisplayPrefKey; title: string; desc: string }> = [
    { key: "showLiveScore", title: scoreCopy.liveTitle, desc: scoreCopy.liveDesc },
    { key: "showFinalScore", title: scoreCopy.finalTitle, desc: scoreCopy.finalDesc },
  ];

  const start = () => onStart({ notify });

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={start}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
            tint="dark"
            intensity={Platform.OS === "ios" ? 28 : 22}
            {...nativeBlurViewExtraProps()}
          />
        )}
        <View style={styles.scrim} pointerEvents="none" />

        <View style={styles.cardWrap}>
          <PredictOverlayChamferedFrameNative
            cut={PREDICT_OVERLAY_CYBER_FORM_CUT}
            gradientColors={["#000000", "#000000"]}
            gradientLocations={[0, 1]}
            borderColor="rgba(0,245,255,0.28)"
            shadowColor="#00f5ff"
            shadowOpacity={0.1}
            shadowRadius={24}
            style={styles.card}
            contentStyle={styles.cardContent}
          >
            <View style={styles.headerBrandRow} pointerEvents="none">
              <View style={styles.headerBrandLine} />
              <UniterzLogoNative width={112} />
              <View style={styles.headerBrandLine} />
            </View>

            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.body}>{t.body}</Text>

            <Text style={styles.sectionTitle}>{t.notifySection}</Text>
            <View style={styles.panel}>
              <View style={styles.row}>
                <View style={styles.textCol}>
                  <Text style={styles.rowTitle}>{t.notifyTitle}</Text>
                  <Text style={styles.rowDesc}>{t.notifyDesc}</Text>
                </View>
                <SettingSwitch value={notify} onChange={setNotify} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t.scoreSection}</Text>
            <View style={styles.panel}>
              {scoreRows.map((row, i) => (
                <View key={row.key} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <View style={styles.textCol}>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    <Text style={styles.rowDesc}>{row.desc}</Text>
                  </View>
                  <SettingSwitch
                    value={prefs[row.key]}
                    onChange={(v) => void updatePref(row.key, v)}
                  />
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <ModalActionRowNative>
                <ModalActionButtonNative label={t.start} tone="primary" onPress={start} />
              </ModalActionRowNative>
            </View>
          </PredictOverlayChamferedFrameNative>
        </View>
      </View>
    </Modal>
  );
}

const OXANIUM = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 340,
  },
  card: {
    width: "100%",
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    alignItems: "stretch",
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
    width: "100%",
  },
  headerBrandLine: {
    flex: 1,
    maxWidth: 52,
    height: 1,
    backgroundColor: "rgba(0,245,255,0.55)",
    shadowColor: "#00f5ff",
    shadowOpacity: 0.65,
    shadowRadius: 8,
  },
  title: {
    fontFamily: OXANIUM,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
  },
  body: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    color: "rgba(148,163,184,0.94)",
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontFamily: OXANIUM,
    fontSize: 11,
    letterSpacing: 1.2,
    color: "rgba(165,243,252,0.9)",
  },
  panel: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.18)",
    backgroundColor: "rgba(0,245,255,0.04)",
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    color: "rgba(248,250,252,0.96)",
    fontSize: 13,
    fontWeight: "700",
  },
  rowDesc: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 11,
    lineHeight: 15,
  },
  actions: {
    marginTop: 18,
    width: "100%",
  },
});
