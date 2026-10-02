/**
 * Web `LegalDocument` / `TermsDocument` / `PrivacyDocument` 相当。
 * アプリ内に同梱した copy をそのまま描画（外部 URL / WebView 不要）。
 */
import { StyleSheet, Text, View } from "react-native";
import type { LegalLang, LegalSection } from "@/lib/legal/legalSection";

type Props = {
  language: LegalLang;
  preamble?: readonly string[];
  sections: readonly LegalSection[];
  footer?: readonly string[];
  /** false のとき条番号プレフィックスなし（Web TermsDocument と同じ） */
  showIndex?: boolean;
};

export default function LegalDocumentNative({
  language,
  preamble = [],
  sections,
  footer = [],
  showIndex = false,
}: Props) {
  const lang: LegalLang = language === "ja" ? "ja" : "en";

  return (
    <View style={styles.root}>
      {preamble.length > 0 ? (
        <View style={styles.block}>
          {preamble.map((text) => (
            <Text key={text.slice(0, 48)} style={styles.p}>
              {text}
            </Text>
          ))}
        </View>
      ) : null}

      {sections.map((section, index) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.h2}>
            {showIndex ? `${index + 1}. ` : ""}
            {section.title[lang]}
          </Text>
          {section.paragraphs?.[lang]?.map((text) => (
            <Text key={text.slice(0, 48)} style={styles.p}>
              {text}
            </Text>
          ))}
          {section.bullets?.[lang] ? (
            <View style={styles.list}>
              {section.bullets[lang].map((line) => (
                <Text key={line.slice(0, 48)} style={styles.li}>
                  {`・${line}`}
                </Text>
              ))}
            </View>
          ) : null}
          {section.subsections?.map((sub) => (
            <View key={sub.title[lang]} style={styles.sub}>
              <Text style={styles.h3}>{sub.title[lang]}</Text>
              {sub.paragraphs?.[lang]?.map((text) => (
                <Text key={text.slice(0, 48)} style={styles.p}>
                  {text}
                </Text>
              ))}
              {sub.bullets?.[lang] ? (
                <View style={styles.list}>
                  {sub.bullets[lang].map((line) => (
                    <Text key={line.slice(0, 48)} style={styles.li}>
                      {`・${line}`}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ))}

      {footer.length > 0 ? (
        <View style={styles.footer}>
          {footer.map((line) => (
            <Text key={line} style={styles.footerLine}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 20,
  },
  block: {
    gap: 12,
  },
  section: {
    gap: 8,
  },
  sub: {
    marginTop: 8,
    gap: 6,
  },
  h2: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 22,
  },
  h3: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 20,
  },
  p: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.8)",
  },
  list: {
    gap: 6,
  },
  li: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.8)",
  },
  footer: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 4,
  },
  footerLine: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.7)",
  },
});
