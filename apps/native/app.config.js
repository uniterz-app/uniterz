/**
 * Expo config。preview は APP_VARIANT=preview で .dev の applicationId にする。
 * package / bundleId は eas.json ではなくここ（現行 eas-cli の制約）。
 */
const appJson = require("./app.json");

const variant = process.env.APP_VARIANT ?? "production";
const isPreview = variant === "preview";

const base = appJson.expo;

/**
 * AdMob（リワード＝PRO PICK / Buzz、バナー＝リザルト一覧）。アプリ ID は本番では環境変数で差し替える（EAS の env）。
 * 未設定のときは Google の公式テスト用 ID（開発・確認用。本番に出さない）。
 */
const ADMOB_TEST_ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";
const ADMOB_TEST_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";

/**
 * iOS の SKAdNetwork（広告の計測）の ID。Info.plist の SKAdNetworkItems に入る。
 * 出典: Google 公式「iOS 14 対応」ページの一覧（developers.google.com/admob/ios/ios14・2026-11-18 更新）。
 * Meta Audience Network の ID（v9wttpbfk9 / n38lu8286q）もこの一覧に含まれる。
 * 広告ネットワークが増えたら、同ページの一覧に合わせて足す。
 */
const ADMOB_SKADNETWORK_IDS = [
  "22mmun2rn5.skadnetwork",
  "2fnua5tdw4.skadnetwork",
  "2u9pt9hc89.skadnetwork",
  "3qcr597p9d.skadnetwork",
  "3qy4746246.skadnetwork",
  "3rd42ekr43.skadnetwork",
  "3sh42y64q3.skadnetwork",
  "4468km3ulz.skadnetwork",
  "44jx6755aq.skadnetwork",
  "47vhws6wlr.skadnetwork",
  "4dzt52r2t5.skadnetwork",
  "4fzdc2evr5.skadnetwork",
  "578prtvx9j.skadnetwork",
  "7ug5zh24hu.skadnetwork",
  "8c4e2ghe7u.skadnetwork",
  "8s468mfl3y.skadnetwork",
  "97r2b46745.skadnetwork",
  "9t245vhmpl.skadnetwork",
  "a2p9lx4jpn.skadnetwork",
  "c3frkrj4fj.skadnetwork",
  "c6k4g5qg8m.skadnetwork",
  "cp8zw746q7.skadnetwork",
  "cstr6suwn9.skadnetwork",
  "e5fvkxwrpn.skadnetwork",
  "f38h382jlk.skadnetwork",
  "gta9lk7p23.skadnetwork",
  "hs6bdukanm.skadnetwork",
  "k674qkevps.skadnetwork",
  "kbd757ywx3.skadnetwork",
  "kbmxgpxpgc.skadnetwork",
  "klf5c3l5u5.skadnetwork",
  "ludvb6z3bs.skadnetwork",
  "mlmmfzh3r3.skadnetwork",
  "n38lu8286q.skadnetwork",
  "p78axxw29g.skadnetwork",
  "ppxm28t8ap.skadnetwork",
  "s39g8k73mm.skadnetwork",
  "su67r6k2v3.skadnetwork",
  "t38b2kh725.skadnetwork",
  "tl55sbb4fm.skadnetwork",
  "uw77j35x4d.skadnetwork",
  "v4nxqhlyqp.skadnetwork",
  "v72qych5uu.skadnetwork",
  "v9wttpbfk9.skadnetwork",
  "vutu7akeur.skadnetwork",
  "wg4vff78zm.skadnetwork",
  "wzmmz9fp6w.skadnetwork",
  "y5ghdn5j9k.skadnetwork",
  "yclnxrl5pm.skadnetwork",
  "ydx93a7ass.skadnetwork",
];

const adMobPlugin = [
  "react-native-google-mobile-ads",
  {
    androidAppId: process.env.ADMOB_ANDROID_APP_ID || ADMOB_TEST_ANDROID_APP_ID,
    iosAppId: process.env.ADMOB_IOS_APP_ID || ADMOB_TEST_IOS_APP_ID,
    skAdNetworkItems: ADMOB_SKADNETWORK_IDS,
  },
];

/**
 * iOS の ATT（トラッキングの許可ダイアログ）。ユーザーに表示される説明文。
 * 広告の同意（UMP）のあとに、未回答のときだけ出す（adsConsentNative.ts）。
 */
const attPlugin = [
  "expo-tracking-transparency",
  {
    userTrackingPermission:
      "他のアプリやサイトでのあなたの利用状況に合わせた広告を表示するために使用します。許可しなくても、アプリはそのまま使えます。",
  },
];

const metaMediationPlugin = "./plugins/withAdMobMetaMediation.js";

module.exports = {
  ...base,
  plugins: [...(base.plugins ?? []), adMobPlugin, attPlugin, metaMediationPlugin],
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
    // FCM（Android プッシュ）。Firebase には com.uniterz.app しか登録していない
    ...(isPreview ? {} : { googleServicesFile: "./google-services.json" }),
    usesCleartextTraffic: isPreview,
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
  },
  extra: {
    ...base.extra,
    eas: {
      ...(base.extra?.eas ?? {}),
      projectId: "f5595b90-9704-42b0-8578-bc3585e9de14",
    },
  },
};
