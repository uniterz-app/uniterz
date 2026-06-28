import type { CyberAlertButton, CyberAlertPayload, CyberAlertVariant } from "./cyberAlertTypes";

function inferVariant(
  title: string,
  message: string,
  buttons: CyberAlertButton[]
): CyberAlertVariant {
  if (buttons.length > 1) return "confirm";
  const blob = `${title}\n${message}`.toLowerCase();
  if (
    /error|エラー|失敗|failed|invalid|missing|denied|could not|unable|送信失敗|購入エラー/.test(
      blob
    )
  ) {
    return "error";
  }
  if (
    /完了|saved|posted|updated|success|保存|投稿|更新|copied|コピー|joined|参加|left group|退会|restored|復元|activated|有効|ended|終了|送信しました|許可/.test(
      blob
    )
  ) {
    return "success";
  }
  return "info";
}

export function buildCyberAlertPayload(
  title: string,
  message?: string,
  buttons?: CyberAlertButton[]
): CyberAlertPayload {
  const normalizedButtons =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: "OK", style: "default" as const }];
  const msg = message ?? "";
  return {
    title,
    message: msg,
    buttons: normalizedButtons,
    variant: inferVariant(title, msg, normalizedButtons),
  };
}
