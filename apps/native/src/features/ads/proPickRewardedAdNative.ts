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
import { AppState, Platform, type NativeEventSubscription } from "react-native";
import { ensureAdsReadyNative, loadAdsModuleNative } from "./adsConsentNative";

export type ProPickRewardedResult = "earned" | "closed" | "error";

/** 広告の用途（広告ユニットを分ける単位） */
export type RewardedAdPlacement = "pro_pick" | "trade_buzz";

type RewardedShowOpts = {
  userId: string;
  customData: Record<string, string>;
  placement?: RewardedAdPlacement;
  /** 広告が前面に出た瞬間（App Store に飛ぶ前でも）。シートの × より先に見た判定を残す */
  onPresented?: () => void;
};

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

function whenAppActive(fn: () => void): () => void {
  if (AppState.currentState === "active") {
    fn();
    return () => {};
  }
  let sub: NativeEventSubscription | null = AppState.addEventListener(
    "change",
    (state) => {
      if (state !== "active") return;
      sub?.remove();
      sub = null;
      fn();
    }
  );
  return () => {
    sub?.remove();
    sub = null;
  };
}

/**
 * リワード広告を表示する（用途は `customData` で SSV に渡す）。
 * - `userId` は SSV の user_id に入る（サーバーはこれで誰の報酬かを確かめる）
 * - `customData` は SSV の custom_data に入る（用途の判定に使う。例: `{ feature: "trade_buzz" }`）
 */
export async function showRewardedAdNative(
  opts: RewardedShowOpts
): Promise<ProPickRewardedResult> {
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
      let closed = false;
      let shown = false;
      let presenting = false;
      let settled = false;
      let closeTimer: ReturnType<typeof setTimeout> | null = null;
      let cancelWaitActive: (() => void) | null = null;
      const unsubs: Array<() => void> = [];
      const finish = (result: ProPickRewardedResult) => {
        if (settled) return;
        settled = true;
        if (closeTimer) clearTimeout(closeTimer);
        cancelWaitActive?.();
        unsubs.forEach((u) => u());
        resolve(result);
      };
      const finishAfterForeground = (result: ProPickRewardedResult) => {
        cancelWaitActive?.();
        cancelWaitActive = whenAppActive(() => finish(result));
      };
      const settleAfterClose = () => {
        // App Store に飛んだ CLOSED は裏にいるあいだ確定しない（UNITERZ のモーダルを重ねない）
        const result: ProPickRewardedResult = earned || shown ? "earned" : "closed";
        if (AppState.currentState !== "active") {
          finishAfterForeground(result);
          return;
        }
        if (earned || shown) {
          finish("earned");
          return;
        }
        closeTimer = setTimeout(
          () => finish(earned || shown ? "earned" : "closed"),
          1_500
        );
      };
      // 読み込み待ちだけ。出してからは切らない
      const loadTimer = setTimeout(() => {
        if (!presenting && !shown) finish("error");
      }, 30_000);
      unsubs.push(() => clearTimeout(loadTimer));
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          presenting = true;
          clearTimeout(loadTimer);
          ad.show().catch(() => {
            if (!shown && !earned) finish("error");
          });
        })
      );
      unsubs.push(
        ad.addAdEventListener(AdEventType.OPENED, () => {
          shown = true;
          opts.onPresented?.();
        })
      );
      unsubs.push(
        ad.addAdEventListener(AdEventType.CLICKED, () => {
          earned = true;
          shown = true;
          opts.onPresented?.();
        })
      );
      unsubs.push(
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
          shown = true;
          opts.onPresented?.();
          if (closed) finishAfterForeground("earned");
        })
      );
      unsubs.push(
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          closed = true;
          if (presenting) shown = true;
          if (!earned) opts.onPresented?.();
          settleAfterClose();
        })
      );
      unsubs.push(
        ad.addAdEventListener(AdEventType.ERROR, () => {
          if (earned || shown) {
            finishAfterForeground("earned");
            return;
          }
          if (presenting || closed) return;
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
  onPresented?: () => void;
}): Promise<ProPickRewardedResult> {
  return showRewardedAdNative({
    userId: opts.userId,
    customData: { feature: "trade_buzz" },
    placement: "trade_buzz",
    onPresented: opts.onPresented,
  });
}

/** PRO PICK の「この試合だけ」解除用（custom_data は `{ gameId }`） */
export function showProPickRewardedAdNative(opts: {
  userId: string;
  gameId: string;
  onPresented?: () => void;
}): Promise<ProPickRewardedResult> {
  return showRewardedAdNative({
    userId: opts.userId,
    customData: { gameId: opts.gameId },
    onPresented: opts.onPresented,
  });
}
