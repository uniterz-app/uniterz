/**
 * Web `readHeldInviteIdsFromLocalStorage` 相当（AsyncStorage）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseHeldInviteIds,
  serializeHeldInviteIds,
  SQUAD_BATTLE_HELD_INVITES_STORAGE_KEY,
} from "../../../../../lib/squads/squadBattleInviteHold";

export async function readHeldInviteIdsNative(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(
      SQUAD_BATTLE_HELD_INVITES_STORAGE_KEY
    );
    return parseHeldInviteIds(raw);
  } catch {
    return [];
  }
}

export async function writeHeldInviteIdsNative(
  ids: readonly string[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      SQUAD_BATTLE_HELD_INVITES_STORAGE_KEY,
      serializeHeldInviteIds(ids)
    );
  } catch {
    // ignore
  }
}
