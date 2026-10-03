/**
 * Google Play Developer API（androidpublisher）用サービスアカウント。
 * GOOGLE_PLAY_SERVICE_ACCOUNT_JSON にサービスアカウント鍵 JSON をそのまま入れる。
 * Play Console → ユーザーと権限 でこのアカウントに「財務データの表示」「注文と定期購入の管理」を付与すること。
 */
export type GooglePlayServiceAccount = {
  clientEmail: string;
  privateKey: string;
};

export function readGooglePlayServiceAccount(): GooglePlayServiceAccount | null {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
    };
    const clientEmail = String(parsed.client_email ?? "").trim();
    const privateKey = String(parsed.private_key ?? "")
      .replace(/\\n/g, "\n")
      .trim();
    if (!clientEmail || !privateKey) return null;
    return { clientEmail, privateKey };
  } catch {
    return null;
  }
}

export function googlePlayPackageName(): string {
  return process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || "com.uniterz.app";
}

export function isGooglePlayIapConfigured(): boolean {
  return readGooglePlayServiceAccount() != null;
}

/** RTDN（Pub/Sub push）URL の ?secret= と照合する共有シークレット */
export function googlePlayRtdnSecret(): string | null {
  return process.env.GOOGLE_PLAY_RTDN_SECRET?.trim() || null;
}
