/**
 * AdMob メディエーションに Meta Audience Network を入れる。
 * invertase GMA 16.5.0 の SDK ピンに合わせる（Android GMA 25.4.0 / iOS GMA 13.5.0）。
 * `@react-native-google-mobile-ads/facebook` は GMA 17 専用なので使わない。
 *
 * バージョン出典:
 * - Android adapter 6.22.0.1 … Google が GMA 25.4.0 で検証
 * - iOS adapter 6.22.0.0 … CocoaPods が Google-Mobile-Ads-SDK `~> 13.3`（13.5.0 含む）。
 *   6.21.1.1 は `~> 13.3.0`（13.3.x のみ）なので RNGoogleMobileAds 16.5.0 の 13.5.0 ピンと衝突する
 */
const fs = require("fs");
const path = require("path");
const {
  createRunOncePlugin,
  withAppBuildGradle,
  withDangerousMod,
  withPodfile,
} = require("expo/config-plugins");

const MARKER = "withAdMobMetaMediation";
const ANDROID_DEP = "com.google.ads.mediation:facebook:6.22.0.1";
const IOS_POD = "GoogleMobileAdsMediationFacebook";
const IOS_POD_VERSION = "6.22.0.0";

const PROGUARD = `
# ${MARKER} Meta Audience Network (AdMob mediation)
-keep class com.google.ads.mediation.facebook.** { *; }
-keep class com.facebook.ads.** { *; }
`;

function withAdMobMetaMediation(config) {
  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") return cfg;
    let contents = cfg.modResults.contents;
    if (contents.includes(ANDROID_DEP) || contents.includes("com.google.ads.mediation:facebook")) {
      return cfg;
    }
    if (!/dependencies\s*\{/.test(contents)) {
      throw new Error("[withAdMobMetaMediation] android/app/build.gradle に dependencies がありません");
    }
    contents = contents.replace(
      /dependencies\s*\{/,
      `dependencies {\n    // ${MARKER}\n    implementation "${ANDROID_DEP}"`
    );
    cfg.modResults.contents = contents;
    return cfg;
  });

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, "app/proguard-rules.pro");
      if (!fs.existsSync(file)) return cfg;
      const contents = fs.readFileSync(file, "utf8");
      if (contents.includes(MARKER)) return cfg;
      fs.writeFileSync(file, `${contents.trimEnd()}\n${PROGUARD}`);
      return cfg;
    },
  ]);

  config = withPodfile(config, (cfg) => {
    if (cfg.modResults.contents.includes(MARKER)) return cfg;
    if (!cfg.modResults.contents.includes("use_expo_modules!")) {
      throw new Error("[withAdMobMetaMediation] Podfile に use_expo_modules! がありません");
    }
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /use_expo_modules!/,
      `use_expo_modules!\n  pod '${IOS_POD}', '${IOS_POD_VERSION}' # ${MARKER}`
    );
    return cfg;
  });

  return config;
}

module.exports = createRunOncePlugin(withAdMobMetaMediation, MARKER, "1.0.0");
