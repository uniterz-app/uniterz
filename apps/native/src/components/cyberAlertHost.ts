import type { CyberAlertPayload } from "./cyberAlertTypes";
import { buildCyberAlertPayload } from "./buildCyberAlertPayload";
import type { CyberAlertButton } from "./cyberAlertTypes";

type Enqueue = (payload: CyberAlertPayload) => void;

let enqueueRef: Enqueue | null = null;

export function registerCyberAlertHost(next: Enqueue | null) {
  enqueueRef = next;
}

/** React Native `Alert.alert` 互換 — 角切り cyber モーダル */
export function cyberAlert(
  title: string,
  message?: string,
  buttons?: CyberAlertButton[]
): void {
  const payload = buildCyberAlertPayload(title, message, buttons);
  if (enqueueRef) {
    enqueueRef(payload);
    return;
  }
  // Provider 未マウント時のフォールバック（開発初期化など）
  console.warn("[cyberAlert] CyberAlertProvider is not mounted:", title, message);
}
