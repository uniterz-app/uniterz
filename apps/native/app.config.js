/**
 * Expo config。preview は APP_VARIANT=preview で .dev の applicationId にする。
 * package / bundleId は eas.json ではなくここ（現行 eas-cli の制約）。
 */
const appJson = require("./app.json");

const variant = process.env.APP_VARIANT ?? "production";
const isPreview = variant === "preview";

const base = appJson.expo;

module.exports = {
  ...base,
  name: isPreview ? "UNITERZ (Dev)" : base.name,
  ios: {
    ...base.ios,
    bundleIdentifier: isPreview
      ? "com.uniterz.app.dev"
      : "com.uniterz.app",
  },
  android: {
    ...base.android,
    package: isPreview ? "com.uniterz.app.dev" : "com.uniterz.app",
  },
  extra: {
    ...base.extra,
    eas: {
      ...(base.extra?.eas ?? {}),
      projectId: "f5595b90-9704-42b0-8578-bc3585e9de14",
    },
  },
};
