/**
 * Universal Links（iOS AASA）/ App Links（Android assetlinks.json）の中身。
 * Team ID と署名証明書は env からだけ読む（未設定なら null → 404）。
 *   APPLE_TEAM_ID                       例: ABCDE12345
 *   ANDROID_SHA256_CERT_FINGERPRINTS    カンマ区切り（Play のアプリ署名鍵）
 */

export const APP_BUNDLE_ID = "com.uniterz.app";
export const ANDROID_PACKAGE = "com.uniterz.app";

/** アプリで開く共有パス（`parseShareDeepLink` と揃える） */
export const APP_LINK_PATHS = [
  "/mobile/result/*",
  "/mobile/u/*",
  "/mobile/communities/*",
  "/mobile/rankings",
] as const;

export function buildAppleAppSiteAssociation(): Record<string, unknown> | null {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  if (!teamId) return null;
  const appId = `${teamId}.${APP_BUNDLE_ID}`;
  return {
    applinks: {
      details: [
        {
          appIDs: [appId],
          components: APP_LINK_PATHS.map((p) => ({ "/": p })),
        },
      ],
    },
  };
}

export function buildAndroidAssetLinks(): unknown[] | null {
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!fingerprints.length) return null;
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];
}
