/**
 * Web `/mobile/electronic-notice` 相当。
 * アプリ内表示（WebView / 外部接続なし）。英語 UI は英語住所。
 */
import { StyleSheet, Text, View } from "react-native";
import {
  companyAddress,
  companyLegalName,
  companyRepresentative,
  COMPANY_WEB_URL,
} from "@/lib/legal/companyInfo";
import LegalPageLayoutNative from "./LegalPageLayoutNative";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";

const NOTICE_URL = `${COMPANY_WEB_URL}/web/electronic-notice`;

export default function ElectronicNoticeScreenNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = language === "en" ? "en" : "ja";
  const isEn = lang === "en";

  const rows = isEn
    ? [
        { label: "Company", value: companyLegalName("en") },
        { label: "Address", value: companyAddress("en") },
        { label: "Representative", value: companyRepresentative("en") },
        { label: "Method of notice", value: "Electronic notice" },
        { label: "Notice URL", value: NOTICE_URL },
        {
          label: "Notices",
          value: "There are currently no matters requiring notice.",
        },
      ]
    : [
        { label: "会社名", value: companyLegalName("ja") },
        { label: "所在地", value: companyAddress("ja") },
        { label: "代表者", value: companyRepresentative("ja") },
        { label: "公告の方法", value: "電子公告" },
        { label: "公告掲載 URL", value: NOTICE_URL },
        { label: "公告事項", value: "現在、公告すべき事項はありません。" },
      ];

  return (
    <LegalPageLayoutNative
      title="NOTICE"
      description={
        isEn
          ? "Electronic notices under the Companies Act."
          : "会社法の規定に基づく電子公告ページです。"
      }
    >
      <View style={styles.root}>
        <Text style={styles.heading}>
          {isEn ? "Electronic Notice" : "電子公告"}
        </Text>
        <Text style={styles.lead}>
          {isEn
            ? `${companyLegalName("en")} publishes notices electronically as required by the Companies Act.`
            : `${companyLegalName("ja")}は、会社法の規定に基づき、電子公告により公告します。`}
        </Text>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
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
