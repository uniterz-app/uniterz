/**
 * リワード広告（AdMob）。PRO PICK 解除・トレード Buzz 解除で使う。
 * 用途ごとに広告ユニットを分ける（同じユニットを使い回さない）。
 *
 * この関数の役割は「広告を表示して、見終わったかどうか」を返すところまで。
 * 解除の確定はサーバー（AdMob の SSV コールバック → 用途ごとの記録）で行う。
 * クライアントの「見た」は信用せず、API の再確認で解除を取る。
 *
 * 広告ユニット ID は EAS の環境変数で差し替える（未設定はテスト用）:
 *   PRO PICK: EXPO_PUBLIC_ADMOB_REWARDED_ANDROID / EXPO_PUBLIC_ADMOB_REWARDED_IOS
 *   トレード Buzz: EXPO_PUBLIC_ADMOB_TRADE_BUZZ_REWARDED_ANDROID / EXPO_PUBLIC_ADMOB_TRADE_BUZZ_REWARDED_IOS
 *
 * 広告のネイティブ部分が無いビルドでは "error" を返す（起動は止めない）。
 */
import { Platform } from "react-native";
import { ensureAdsReadyNative, loadAdsModuleNative } from "./adsConsentNative";

export type ProPickRewardedResult = "earned" | "closed" | "error";

/** 広告の用途（広告ユニットを分ける単位） */
export type RewardedAdPlacement = "pro_pick" | "trade_buzz";

function rewardedUnitId(testId: string, placement: RewardedAdPlacement): string {
  const ios = Platform.OS === "ios";
  const envId =
    placement === "trade_buzz"
      ? ios
        ? process.env.EXPO_PUBLIC_ADMOB_TRADE_BUZZ_REWARDED_IOS
        : process.env.EXPO_PUBLIC_ADMOB_TRADE_BUZZ_REWARDED_ANDROID
      : ios
        ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS
        : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID;
  return envId?.trim() || testId;
}

/**
 * リワード広告を表示する（用途は `customData` で SSV に渡す）。
 * - `userId` は SSV の user_id に入る（サーバーはこれで誰の報酬かを確かめる）
 * - `customData` は SSV の custom_data に入る（用途の判定に使う。例: `{ feature: "trade_buzz" }`）
 */
export async function showRewardedAdNative(opts: {
  userId: string;
  customData: Record<string, string>;
  placement?: RewardedAdPlacement;
}): Promise<ProPickRewardedResult> {
  const ads = loadAdsModuleNative();
  if (!ads) return "error";
  try {
    // 同意の確認（EU の同意フォームを含む）が済み、広告を出してよいときだけ進む
    const ready = await ensureAdsReadyNative();
    if (!ready) return "error";

    const { AdEventType, RewardedAd, RewardedAdEventType, TestIds } = ads;
    const unitId = rewardedUnitId(
      TestIds.REWARDED,
      opts.placement ?? "pro_pick"
    );
    const ad = RewardedAd.createForAdRequest(unitId, {
      serverSideVerificationOptions: {
        userId: opts.userId,
        customData: JSON.stringify(opts.customData),
      },
    });

    return await new Promise<ProPickRewardedResult>((resolve) => {
      let earned = false;
      const unsubs: Array<() => void> = [];
      const finish = (result: ProPickRewardedResult) => {
        unsubs.forEach((u) => u());
        resolve(result);
      };
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          ad.show().catch(() => finish("error"));
        })
      );
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        })
      );
      unsubs.push(
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          finish(earned ? "earned" : "closed");
        })
      );
      unsubs.push(
        ad.addAdEventListener(AdEventType.ERROR, () => {
          finish("error");
        })
      );
      ad.load();
    });
  } catch {
    return "error";
  }
}

/** トレード Buzz の「今日の解除」用（専用の広告ユニット・custom_data は `{ feature: "trade_buzz" }`） */
export function showTradeBuzzRewardedAdNative(opts: {
  userId: string;
}): Promise<ProPickRewardedResult> {
  return showRewardedAdNative({
    userId: opts.userId,
    customData: { feature: "trade_buzz" },
    placement: "trade_buzz",
  });
}

/** PRO PICK の「この試合だけ」解除用（custom_data は `{ gameId }`） */
export function showProPickRewardedAdNative(opts: {
  userId: string;
  gameId: string;
}): Promise<ProPickRewardedResult> {
  return showRewardedAdNative({
    userId: opts.userId,
    customData: { gameId: opts.gameId },
  });
}
