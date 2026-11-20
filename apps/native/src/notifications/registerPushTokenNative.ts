/** Expo Push Token 取得と API 登録 */
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUniterzApiBaseUrl } from "../features/games/submitPredictionApi";
import { loadExpoNotificationsModule } from "./expoNotificationsModuleNative";

let cachedExpoPushToken: string | null = null;

/** 同じアカウント・同じトークンの登録は起動のたびに送らない（サーバーは 1 回で 3 読み 2 書き） */
const REGISTERED_STORAGE_KEY = "uniterz.pushTokenRegistered.v1";
const REGISTER_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

type RegisteredMark = { uid: string; token: string; at: number };

async function readRegisteredMark(): Promise<RegisteredMark | null> {
  try {
    const raw = await AsyncStorage.getItem(REGISTERED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RegisteredMark>;
    if (typeof parsed.uid !== "string" || typeof parsed.token !== "string") return null;
    return { uid: parsed.uid, token: parsed.token, at: Number(parsed.at) || 0 };
  } catch {
    return null;
  }
}

function clearRegisteredMark(): Promise<void> {
  return AsyncStorage.removeItem(REGISTERED_STORAGE_KEY).catch(() => undefined);
}

export function getCachedExpoPushToken(): string | null {
  return cachedExpoPushToken;
}

export async function requestPushPermissionsNative(): Promise<boolean> {
  const Notifications = await loadExpoNotificationsModule();
  if (!Notifications || !Device.isDevice) return false;

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

export async function getExpoPushTokenIfGrantedNative(): Promise<string | null> {
  const Notifications = await loadExpoNotificationsModule();
  if (!Notifications || !Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.slug;

  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId: String(projectId) } : undefined
  );
  const token = tokenResult.data?.trim();
  if (!token) return null;

  cachedExpoPushToken = token;
  return token;
}

export async function resolveExpoPushTokenNative(): Promise<string | null> {
  const Notifications = await loadExpoNotificationsModule();
  if (!Notifications || !Device.isDevice) return null;

  const granted = await requestPushPermissionsNative();
  if (!granted) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.slug;

  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId: String(projectId) } : undefined
  );
  const token = tokenResult.data?.trim();
  if (!token) return null;

  cachedExpoPushToken = token;
  return token;
}

export async function registerPushTokenWithApiNative(
  expoPushToken: string
): Promise<void> {
  const base = getUniterzApiBaseUrl();
  if (!base) return;

  const user = auth.currentUser;
  if (!user) return;

  const mark = await readRegisteredMark();
  if (
    mark &&
    mark.uid === user.uid &&
    mark.token === expoPushToken &&
    Date.now() - mark.at < REGISTER_REFRESH_MS
  ) {
    return;
  }

  const idToken = await user.getIdToken();
  const res = await fetch(`${base}/api/me/push-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      expoPushToken,
      platform: Platform.OS === "ios" ? "ios" : "android",
      deviceName: Device.modelName ?? undefined,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const { trackAppEvent, reportAppError } = await import(
      "../../../../lib/observability/trackAppEvent"
    );
    trackAppEvent({ name: "push_token_register", props: { ok: false } });
    reportAppError("push_token_register", new Error(`${res.status} ${text}`));
    throw new Error(`push-token register failed: ${res.status} ${text}`);
  }

  await AsyncStorage.setItem(
    REGISTERED_STORAGE_KEY,
    JSON.stringify({ uid: user.uid, token: expoPushToken, at: Date.now() })
  ).catch(() => undefined);

  const { trackAppEvent } = await import(
    "../../../../lib/observability/trackAppEvent"
  );
  trackAppEvent({ name: "push_token_register", props: { ok: true } });
}

export async function unregisterPushTokenFromApiNative(
  expoPushToken: string
): Promise<void> {
  const base = getUniterzApiBaseUrl();
  if (!base) return;

  await clearRegisteredMark();

  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  await fetch(`${base}/api/me/push-token`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ expoPushToken }),
  }).catch(() => undefined);
}

/**
 * ログアウト。signOut 後は currentUser が無く DELETE を送れないので、先に端末トークンを外す
 * （外さないと次の人がログインするまで前のアカウントの通知が届く）
 */
export async function signOutWithPushUnregisterNative(): Promise<void> {
  const token = cachedExpoPushToken;
  if (token) {
    await Promise.race([
      unregisterPushTokenFromApiNative(token).catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ]);
  }
  await clearRegisteredMark();
  await signOut(auth);
}

export async function registerNativePushTokenIfGranted(): Promise<string | null> {
  const token = await getExpoPushTokenIfGrantedNative();
  if (!token) return null;
  await registerPushTokenWithApiNative(token);
  return token;
}

export async function registerNativePushTokenFlow(): Promise<string | null> {
  const token = await resolveExpoPushTokenNative();
  if (!token) return null;
  await registerPushTokenWithApiNative(token);
  return token;
}
