import { JWT } from "google-auth-library";
import {
  googlePlayPackageName,
  readGooglePlayServiceAccount,
} from "@/lib/billing/google/googlePlayEnv";

const ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const API_BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";

export type GoogleSubscriptionState =
  | "SUBSCRIPTION_STATE_UNSPECIFIED"
  | "SUBSCRIPTION_STATE_PENDING"
  | "SUBSCRIPTION_STATE_ACTIVE"
  | "SUBSCRIPTION_STATE_PAUSED"
  | "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
  | "SUBSCRIPTION_STATE_ON_HOLD"
  | "SUBSCRIPTION_STATE_CANCELED"
  | "SUBSCRIPTION_STATE_EXPIRED"
  | "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED";

/** purchases.subscriptionsv2.get の必要分 */
export type GoogleSubscriptionPurchaseV2 = {
  subscriptionState?: GoogleSubscriptionState;
  linkedPurchaseToken?: string;
  testPurchase?: Record<string, never>;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string;
    autoRenewingPlan?: { autoRenewEnabled?: boolean };
  }>;
};

/** purchases.products.get の必要分（purchaseState: 0 購入済 / 1 キャンセル / 2 保留） */
export type GoogleProductPurchase = {
  purchaseState?: number;
  purchaseTimeMillis?: string;
};

export class GooglePlayApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

let cachedClient: JWT | null = null;

function playClient(): JWT {
  if (cachedClient) return cachedClient;
  const account = readGooglePlayServiceAccount();
  if (!account) throw new Error("google_play_not_configured");
  cachedClient = new JWT({
    email: account.clientEmail,
    key: account.privateKey,
    scopes: [ANDROID_PUBLISHER_SCOPE],
  });
  return cachedClient;
}

async function playGet<T>(path: string): Promise<T> {
  const url = `${API_BASE}/${encodeURIComponent(googlePlayPackageName())}/${path}`;
  try {
    const res = await playClient().request<T>({ url, method: "GET" });
    return res.data;
  } catch (e) {
    const status =
      (e as { response?: { status?: number } }).response?.status ?? 500;
    throw new GooglePlayApiError(
      status,
      e instanceof Error ? e.message : "google_play_request_failed"
    );
  }
}

export function fetchGoogleSubscriptionV2(
  purchaseToken: string
): Promise<GoogleSubscriptionPurchaseV2> {
  return playGet(`purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`);
}

export function fetchGoogleProductPurchase(
  productId: string,
  purchaseToken: string
): Promise<GoogleProductPurchase> {
  return playGet(
    `purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`
  );
}
