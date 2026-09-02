/**
 * IAP スタブ付与は開発・明示オプトインのみ。
 * 本番（NODE_ENV=production）では IAP_VERIFY_STUB_ALLOW=true でも拒否する。
 * Apple 本番検証は APPLE_IAP_* 環境変数（lib/billing/apple/appleIapEnv.ts）。
 */
export function isIapVerifyStubAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.IAP_VERIFY_STUB_ALLOW === "true";
}
