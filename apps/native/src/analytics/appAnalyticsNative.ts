/**
 * 画面表示を GA4（Measurement Protocol・Web ストリーム）へ送る。
 * 開発ビルドと、計測 ID / API シークレットが無いビルドでは何もしない。
 * Web ストリームでは screen_view が使えないため page_view で送る。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { AppState, Dimensions, PixelRatio, Platform, type AppStateStatus } from "react-native";

const MEASUREMENT_ID = process.env.EXPO_PUBLIC_GA4_MEASUREMENT_ID ?? "";
const API_SECRET = process.env.EXPO_PUBLIC_GA4_API_SECRET ?? "";
const ENDPOINT = "https://www.google-analytics.com/mp/collect";
const PAGE_ORIGIN = "https://app.uniterz.app";
const CLIENT_ID_KEY = "uniterz.ga4.clientId.v1";
/** GA4 の既定と同じ。これより長くバックグラウンドにいたら次の表示から新しいセッション */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const FLUSH_DELAY_MS = 10_000;
/** Measurement Protocol の 1 リクエスト上限 */
const MAX_BATCH = 25;

const enabled = !__DEV__ && MEASUREMENT_ID !== "" && API_SECRET !== "";

type QueuedEvent = { name: string; params: Record<string, string | number> };

let started = false;
let clientId: string | null = null;
let userId: string | null = null;
let plan: "free" | "pro" | null = null;
let sessionId: number | null = null;
let lastActiveAt = 0;
let foregroundSince: number | null = null;
let pendingEngagementMs = 0;
let lastPage: { title: string; path: string } | null = null;
let lastLocation: string | null = null;
let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function newClientId(): string {
  const rand = Math.floor(Math.random() * 2_147_483_647);
  return `${rand}.${Math.floor(Date.now() / 1000)}`;
}

async function loadClientId(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(CLIENT_ID_KEY);
    if (saved) {
      clientId = saved;
    } else {
      clientId = newClientId();
      await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
    }
  } catch {
    clientId = clientId ?? newClientId();
  }
  scheduleFlush();
}

function deviceInfo(): Record<string, string> {
  const { width, height } = Dimensions.get("screen");
  const scale = PixelRatio.get();
  // device を送るときは browser が必須。アプリ名とバージョンを入れる
  const info: Record<string, string> = {
    category: "mobile",
    browser: "UNITERZ App",
    browser_version: Constants.expoConfig?.version ?? "unknown",
    operating_system: Platform.OS === "ios" ? "iOS" : "Android",
    operating_system_version: Device.osVersion ?? String(Platform.Version),
    screen_resolution: `${Math.round(width * scale)}x${Math.round(height * scale)}`,
  };
  try {
    info.language = Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    /* Intl なし */
  }
  if (Device.modelName) info.model = Device.modelName;
  if (Device.brand) info.brand = Device.brand;
  return info;
}

function onAppStateChange(next: AppStateStatus): void {
  const now = Date.now();
  if (next === "active") {
    const resumedAfterTimeout =
      lastActiveAt > 0 && now - lastActiveAt > SESSION_TIMEOUT_MS;
    foregroundSince = now;
    if (resumedAfterTimeout) {
      sessionId = null;
      pendingEngagementMs = 0;
      if (lastPage) trackPageViewNative(lastPage.title, lastPage.path);
    }
    return;
  }
  if (foregroundSince != null) {
    pendingEngagementMs += now - foregroundSince;
    foregroundSince = null;
  }
  lastActiveAt = now;
  void flush();
}

function ensureStarted(): void {
  if (started) return;
  started = true;
  foregroundSince = AppState.currentState === "active" ? Date.now() : null;
  AppState.addEventListener("change", onAppStateChange);
  void loadClientId();
}

/** 前のイベントからの前面表示時間（GA4 の平均エンゲージメント時間・アクティブユーザーに使われる） */
function takeEngagementMs(now: number): number {
  let ms = pendingEngagementMs;
  if (foregroundSince != null) ms += now - foregroundSince;
  pendingEngagementMs = 0;
  if (foregroundSince != null) foregroundSince = now;
  return Math.max(1, Math.min(ms, SESSION_TIMEOUT_MS));
}

function scheduleFlush(): void {
  if (flushTimer || queue.length === 0 || !clientId) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_DELAY_MS);
}

async function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!clientId || queue.length === 0) return;
  const batches: QueuedEvent[][] = [];
  while (queue.length > 0) batches.push(queue.splice(0, MAX_BATCH));
  const base: Record<string, unknown> = {
    client_id: clientId,
    device: deviceInfo(),
    consent: { ad_user_data: "DENIED", ad_personalization: "DENIED" },
  };
  if (userId) base.user_id = userId;
  if (plan) base.user_properties = { plan: { value: plan } };
  const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(MEASUREMENT_ID)}&api_secret=${encodeURIComponent(API_SECRET)}`;
  for (const events of batches) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...base, events }),
      });
    } catch {
      /* 計測の失敗は UI に影響させない */
    }
  }
}

/** パスに入れる名前を英小文字とハイフンにする（`LeBron James` → `lebron-james`） */
export function analyticsSlug(value: string): string {
  let base = value;
  try {
    base = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    /* normalize なし */
  }
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 予想画面のパス（`games/predict/lakers-at-celtics?game=…`）。`tab` があればその下 */
export function predictAnalyticsPath(
  gameId: unknown,
  awayLabel: string,
  homeLabel: string,
  tab?: string
): string {
  const away = analyticsSlug(awayLabel);
  const home = analyticsSlug(homeLabel);
  const matchup = away && home ? `/${away}-at-${home}` : "";
  const id = gameId != null && String(gameId) !== "" ? `?game=${encodeURIComponent(String(gameId))}` : "";
  return `games/predict${matchup}${tab ? `/${tab}` : ""}${id}`;
}

/**
 * 1 画面の表示を記録する。`path` は `games/standings` のような英小文字の区切り。
 * `query` は page_location の検索部分に付ける（GA4 の「ページパスとクエリ文字列」で見える）。
 */
export function trackPageViewNative(
  title: string,
  path: string,
  query?: Record<string, string>
): void {
  if (!enabled) return;
  ensureStarted();
  const now = Date.now();
  if (sessionId == null || (lastActiveAt > 0 && now - lastActiveAt > SESSION_TIMEOUT_MS)) {
    sessionId = Math.floor(now / 1000);
  }
  lastActiveAt = now;
  lastPage = { title, path };
  const search = query
    ? `?${Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")}`
    : "";
  const location = `${PAGE_ORIGIN}/${path}${search}`;
  const params: Record<string, string | number> = {
    page_title: title.slice(0, 100),
    page_location: location.slice(0, 100),
    session_id: sessionId,
    engagement_time_msec: takeEngagementMs(now),
    timestamp_micros: now * 1000,
  };
  if (lastLocation) params.page_referrer = lastLocation.slice(0, 100);
  lastLocation = location;
  queue.push({ name: "page_view", params });
  if (queue.length >= MAX_BATCH) void flush();
  else scheduleFlush();
}

/** ログイン中のユーザーとプラン。GA4 の User-ID（端末をまたいだ同一人物）と `plan` ユーザープロパティに使う */
export function setAnalyticsUserNative(
  uid: string | null,
  userPlan: "free" | "pro" | null
): void {
  userId = uid;
  plan = userPlan;
}
