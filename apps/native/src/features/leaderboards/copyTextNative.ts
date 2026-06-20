import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";

export async function copyTextNative(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

export async function pasteTextNative(): Promise<string | null> {
  try {
    const text = (await Clipboard.getStringAsync()).trim().toUpperCase().replace(/\s+/g, "");
    return text || null;
  } catch {
    return null;
  }
}

export async function shareTextNative(title: string, message: string): Promise<"shared" | "cancelled" | "failed"> {
  try {
    const result = await Share.share({ title, message });
    if (result.action === Share.dismissedAction) return "cancelled";
    return "shared";
  } catch {
    return "failed";
  }
}
