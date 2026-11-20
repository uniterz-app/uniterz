/**
 * 表示設定: シーズン予想（アワード / 順位）を他の人に見せない設定。
 * 締切前は他人には常に非公開（サーバーが返さない）。締切後は既定で公開し、ここでオフにできる。
 * 保存先は users/{uid}/private/displayPrefs の `seasonPredictHidden`（サーバーの閲覧判定もここを読む）。
 */
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeLanguage } from "../../i18n/NativeLanguageProvider";
import { db } from "../../lib/firebase";
import { USER_PRIVATE_DISPLAY_PREFS_DOC } from "@/lib/user/userPrivatePaths";

const HIDDEN_FIELD = "seasonPredictHidden";

export default function SeasonPredictVisibilitySettingsNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeLanguage();
  const ja = language === "ja";
  const uid = fUser?.uid ?? null;
  /** null = 読み込み中（ログアウト時も含む） */
  const [hidden, setHidden] = useState<boolean | null>(null);

  useEffect(() => {
    if (!uid) {
      setHidden(null);
      return;
    }
    let alive = true;
    void getDoc(doc(db, "users", uid, "private", USER_PRIVATE_DISPLAY_PREFS_DOC))
      .then((snap) => {
        if (alive) setHidden(snap.data()?.[HIDDEN_FIELD] === true);
      })
      .catch(() => {
        if (alive) setHidden(false);
      });
    return () => {
      alive = false;
    };
  }, [uid]);

  const onChange = (value: boolean) => {
    if (!uid) return;
    setHidden(value);
    void setDoc(
      doc(db, "users", uid, "private", USER_PRIVATE_DISPLAY_PREFS_DOC),
      { [HIDDEN_FIELD]: value, updatedAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {
      setHidden((prev) => (prev === value ? !value : prev));
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>
        {ja ? "シーズン予想の公開" : "SEASON PREDICTIONS"}
      </Text>
      <Text style={styles.sectionHint}>
        {ja
          ? "提出期限の前は、他の人のプロフィールにシーズン予想（アワード・順位）は表示されません。期限後は公開されますが、ここでオンにすると他の人には表示されなくなります"
          : "Until the deadline, others cannot see your season predictions (awards and standings). After the deadline they are public, unless you turn this on to keep them private"}
      </Text>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.title}>
            {ja ? "期限後も他の人に見せない" : "Keep private after the deadline"}
          </Text>
          <Text style={styles.desc}>
            {ja
              ? "オンの間、あなたのプロフィールのシーズン予想は本人だけに表示されます"
              : "While on, your season predictions are only visible to you on your profile"}
          </Text>
        </View>
        <Switch
          value={hidden === true}
          onValueChange={onChange}
          disabled={hidden === null}
          trackColor={{
            false: "rgba(51,65,85,0.9)",
            true: "rgba(6,182,212,0.55)",
          }}
          thumbColor={
            Platform.OS === "android"
              ? hidden === true
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
