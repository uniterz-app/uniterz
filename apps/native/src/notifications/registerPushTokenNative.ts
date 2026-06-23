/** Expo Push Token 取得と API 登録 */
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { auth } from "../lib/firebase";
import { getUniterzApiBaseUrl } from "../features/games/submitPredictionApi";
import { loadExpoNotificationsModule } from "./expoNotificationsModuleNative";

let cachedExpoPushToken: string | null = null;

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
    throw new Error(`push-token register failed: ${res.status} ${text}`);
  }
}

export async function unregisterPushTokenFromApiNative(
  expoPushToken: string
): Promise<void> {
  const base = getUniterzApiBaseUrl();
  if (!base) return;

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
