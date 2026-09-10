/**
 * Web `/mobile/law` → `TokushohoDocument` 相当。
 * サイバー題名は短い "LAW"。英語 UI では英訳本文＋英語住所。
 */
import { StyleSheet, Text, View } from "react-native";
import {
  TOKUSHOHO_HEADING,
  TOKUSHOHO_UPDATED_AT,
  tokushohoLead,
  tokushohoRows,
} from "@/lib/legal/tokushohoCopy";
import LegalPageLayoutNative from "./LegalPageLayoutNative";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";

export default function CommercialLawScreenNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = language === "ja" ? "ja" : "en";
  const rows = tokushohoRows(lang);
  const lead = tokushohoLead(lang);

  return (
    <LegalPageLayoutNative
      title="LAW"
      description={lead}
      updatedAt={TOKUSHOHO_UPDATED_AT}
      lastUpdatedLabel={lang === "en" ? "Last updated: " : "最終更新: "}
    >
      <View style={styles.root}>
        <Text style={styles.heading}>{TOKUSHOHO_HEADING[lang]}</Text>
        <Text style={styles.lead}>{lead}</Text>
        {rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </View>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 22,
  },
  lead: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.8)",
  },
  row: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 20,
  },
  value: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.8)",
  },
});
