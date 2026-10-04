"use client";

/** Native `DisplaySettingsScreenNative` 相当 — サイドメニュー「表示設定」 */
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import MatchScoreDisplaySettings from "@/app/component/settings/MatchScoreDisplaySettings";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { matchScoreDisplayCopy } from "@/lib/games/matchScoreDisplayPrefs";

export default function DisplaySettingsPage() {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const copy = matchScoreDisplayCopy(language);
  return (
    <ProfileCyberPage title="DISPLAY" subtitle={copy.pageDescription}>
      <MatchScoreDisplaySettings />
    </ProfileCyberPage>
  );
}
