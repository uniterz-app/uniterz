/** 表示設定: 投稿後の「次の試合も予想しますか？」案内のオン / オフ（「今後表示しない」で止めた分を戻せる） */
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeLanguage } from "../../i18n/NativeLanguageProvider";
import {
  readPredictNextGameModalSkip,
  setPredictNextGameModalSkip,
} from "../games/predictNextGameModalPrefs";

export default function PredictNextGamePromptSettingsNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeLanguage();
  const ja = language === "ja";
  const uid = fUser?.uid ?? null;
  /** null = 読み込み中（ログアウト時も含む） */
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    if (!uid) {
      setShow(null);
      return;
    }
    let alive = true;
    void readPredictNextGameModalSkip(uid).then((skip) => {
      if (alive) setShow(!skip);
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  const onChange = (value: boolean) => {
    if (!uid) return;
    setShow(value);
    void setPredictNextGameModalSkip(uid, !value);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>
        {ja ? "次の試合の案内" : "NEXT GAME PROMPT"}
      </Text>
      <Text style={styles.sectionHint}>
        {ja
          ? "予想のあとに次の試合を続けて予想するか聞く案内を切り替えます。アカウントに保存され、ほかの端末にも反映されます"
          : "Switch the prompt that asks whether to predict the next game after you submit. Saved to your account and applies on all devices"}
      </Text>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.title}>
            {ja ? "次の試合も予想しますか？を表示" : "Show “Predict the next game too?”"}
          </Text>
          <Text style={styles.desc}>
            {ja
              ? "オフにすると案内は出ません。「今後この案内を表示しない」で止めた場合も、ここでオンに戻せます"
              : "When off, the prompt is hidden. If you chose “Don't show this again,” turn it back on here"}
          </Text>
        </View>
        <Switch
          value={show === true}
          onValueChange={onChange}
          disabled={show === null}
          trackColor={{
            false: "rgba(51,65,85,0.9)",
            true: "rgba(6,182,212,0.55)",
          }}
          thumbColor={
            Platform.OS === "android"
              ? show === true
                ? "#67e8f9"
                : "#94a3b8"
              : undefined
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionTitle: {
    color: "#a5f3fc",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sectionHint: {
    marginTop: 4,
    marginBottom: 4,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    lineHeight: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  desc: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 15,
  },
});
