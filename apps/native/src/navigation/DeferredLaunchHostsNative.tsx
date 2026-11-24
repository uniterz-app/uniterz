/**
 * Games 初回描画後にだけマウントする起動ホスト。
 * プッシュと計測は MainTab 側で先に載せる。
 */
import ProfileStatsPrefetchHost from "../features/profile/ProfileStatsPrefetchHost";
import SquadBattleLaunchPromptHostNative from "../features/squads/SquadBattleLaunchPromptHostNative";
import ProSkinUnlockLaunchHostNative from "../features/profile/reports/ProSkinUnlockLaunchHostNative";
import MonthlyBadgeUnlockLaunchHostNative from "../features/profile/MonthlyBadgeUnlockLaunchHostNative";
import StoreReviewLaunchHostNative from "../features/games/StoreReviewLaunchHostNative";
import UnitEarnLaunchHostNative from "../features/units/UnitEarnLaunchHostNative";
import SeasonPredictCrowdLaunchHostNative from "../features/games/predict/season/SeasonPredictCrowdLaunchHostNative";

export default function DeferredLaunchHostsNative() {
  return (
    <>
      <ProfileStatsPrefetchHost />
      <SquadBattleLaunchPromptHostNative />
      <UnitEarnLaunchHostNative />
      <SeasonPredictCrowdLaunchHostNative />
      <ProSkinUnlockLaunchHostNative />
      <MonthlyBadgeUnlockLaunchHostNative />
      <StoreReviewLaunchHostNative />
    </>
  );
}
