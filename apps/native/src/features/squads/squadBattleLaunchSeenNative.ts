/**
 * Web `read/write SquadBattleLaunchSeen` 相当（AsyncStorage）
 * 値 = 見た battleId（大会ごと一度）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SQUAD_BATTLE_LAUNCH_STORAGE_KEY } from "../../../../../lib/squads/squadBattleUiCopy";

export async function readSquadBattleLaunchSeenBattleIdNative(): Promise<
  string | null
> {
  try {
    const v = await AsyncStorage.getItem(SQUAD_BATTLE_LAUNCH_STORAGE_KEY);
    if (!v || v === "1") return null;
    return v;
  } catch {
    return null;
  }
}

/** @deprecated battleId 付き mark / shouldShow を使う */
export async function hasSeenSquadBattleLaunchNative(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(SQUAD_BATTLE_LAUNCH_STORAGE_KEY);
    return Boolean(v && v !== "1");
  } catch {
    return true;
  }
}

export async function markSquadBattleLaunchSeenNative(
  battleId?: string | null
): Promise<void> {
  try {
    const id = String(battleId ?? "").trim();
    await AsyncStorage.setItem(
      SQUAD_BATTLE_LAUNCH_STORAGE_KEY,
      id || "1"
    );
  } catch {
    // ignore
  }
}

export async function clearSquadBattleLaunchSeenNative(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SQUAD_BATTLE_LAUNCH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
