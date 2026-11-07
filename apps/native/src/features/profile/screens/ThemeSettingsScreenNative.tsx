/** サイドメニュー「テーマ」— 黒地 / 白地 */
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import AppThemeSettingsNative from "../AppThemeSettingsNative";
import { useNativeLanguage } from "../../../i18n/NativeLanguageProvider";
import { appThemeCopy } from "../../../../../../lib/theme/appThemeCopy";

export default function ThemeSettingsScreenNative() {
  const { language } = useNativeLanguage();
  const copy = appThemeCopy(language);
  return (
    <LegalPageLayoutNative title="THEME" description={copy.pageDescription}>
      <AppThemeSettingsNative />
    </LegalPageLayoutNative>
  );
}
