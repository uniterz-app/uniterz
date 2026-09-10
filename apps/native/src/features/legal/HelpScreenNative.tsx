import { useState } from "react";
import { StyleSheet, View } from "react-native";
import LegalPageLayoutNative from "./LegalPageLayoutNative";
import HelpAccordionItemNative from "./HelpAccordionItemNative";
import { getHelpFaqsNative, getHelpPageCopy } from "./helpFaqsNative";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import { resolveLocalizedLang } from "../../../../../lib/i18n/localize";

/** Web `/mobile/help` → `HelpPage` 相当 */
export default function HelpScreenNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = resolveLocalizedLang(language);
  const [openId, setOpenId] = useState<string | null>(null);

  const copy = getHelpPageCopy(lang);
  const faqs = getHelpFaqsNative(lang);

  return (
    <LegalPageLayoutNative
      title="HELP"
      description={copy.description}
      updatedAt="2026-03-23"
      lastUpdatedLabel={copy.lastUpdatedLabel}
    >
      <View style={styles.list}>
        {faqs.map((item) => (
          <HelpAccordionItemNative
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
      </View>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
});
