import { Share } from "react-native";

type ExpoClipboardModule = typeof import("expo-clipboard");

/** dev client 未再ビルド時は null（import 時クラッシュを避ける） */
let clipboardModule: ExpoClipboardModule | null | undefined;

async function loadClipboardModule(): Promise<ExpoClipboardModule | null> {
  if (clipboardModule !== undefined) return clipboardModule;
  try {
    clipboardModule = await import("expo-clipboard");
    return clipboardModule;
  } catch {
    clipboardModule = null;
    return null;
  }
}

export async function copyTextNative(text: string): Promise<boolean> {
  if (!text) return false;

  const clipboard = await loadClipboardModule();
  if (clipboard) {
    try {
      await clipboard.setStringAsync(text);
      return true;
    } catch {
      // Share フォールバックへ
    }
  }

  try {
    await Share.share({ message: text });
    return true;
  } catch {
    return false;
  }
}

export async function pasteTextNative(): Promise<string | null> {
  const clipboard = await loadClipboardModule();
  if (!clipboard) return null;

  try {
    const text = (await clipboard.getStringAsync()).trim().toUpperCase().replace(/\s+/g, "");
    return text || null;
  } catch {
    return null;
  }
}

export async function shareTextNative(
  title: string,
  message: string
): Promise<"shared" | "cancelled" | "failed"> {
  try {
    const result = await Share.share({ title, message });
    if (result.action === Share.dismissedAction) return "cancelled";
    return "shared";
  } catch {
    return "failed";
  }
}
