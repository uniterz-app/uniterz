/** App Store Connect API Key（In-App Purchase Server API） */
export function readAppleIapPrivateKey(): string | null {
  const raw = process.env.APPLE_IAP_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";
  return raw.trim() || null;
}

export function appleIapBundleId(): string {
  return process.env.APPLE_IAP_BUNDLE_ID?.trim() || "app.uniterz.mobile";
}

export function appleIapAppAppleId(): number | undefined {
  const raw = process.env.APPLE_IAP_APP_APPLE_ID?.trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function isAppleIapConfigured(): boolean {
  return !!(
    process.env.APPLE_IAP_ISSUER_ID?.trim() &&
    process.env.APPLE_IAP_KEY_ID?.trim() &&
    readAppleIapPrivateKey()
  );
}
