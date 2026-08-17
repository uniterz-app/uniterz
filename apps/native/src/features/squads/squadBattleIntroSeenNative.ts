/**
 * Web `markSquadBattleIntroSeen` / `hasSeenSquadBattleIntro` 相当（AsyncStorage）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SQUAD_BATTLE_INTRO_STORAGE_KEY } from "../../../../../lib/squads/squadBattleMock";

export async function hasSeenSquadBattleIntroNative(): Promise<boolean> {
  try {
    return (
      (await AsyncStorage.getItem(SQUAD_BATTLE_INTRO_STORAGE_KEY)) === "1"
    );
  } catch {
    return true;
  }
}

export async function markSquadBattleIntroSeenNative(): Promise<void> {
  try {
    await AsyncStorage.setItem(SQUAD_BATTLE_INTRO_STORAGE_KEY, "1");
  } catch {
    // private mode 等は無視
  }
}

export async function clearSquadBattleIntroSeenNative(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SQUAD_BATTLE_INTRO_STORAGE_KEY);
  } catch {
    // ignore
  }
}
