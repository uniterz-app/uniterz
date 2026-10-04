/** Web `DisplaySettingsPage` 相当 — サイドメニュー「表示設定」 */
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import MatchScoreDisplaySettingsNative from "../MatchScoreDisplaySettingsNative";
import { useNativeLanguage } from "../../../i18n/NativeLanguageProvider";
import { matchScoreDisplayCopy } from "../../../../../../lib/games/matchScoreDisplayPrefs";

export default function DisplaySettingsScreenNative() {
  const { language } = useNativeLanguage();
  const copy = matchScoreDisplayCopy(language);
  return (
    <LegalPageLayoutNative title="DISPLAY" description={copy.pageDescription}>
      <MatchScoreDisplaySettingsNative />
    </LegalPageLayoutNative>
  );
}
