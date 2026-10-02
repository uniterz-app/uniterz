/**
 * react-native-iap の Play Billing を 8.0.0 以上に固定する。
 * Play Console が Billing Library 8+ を要求するため。
 *
 * RNIap は rootProject.ext.playBillingSdkVersion があればそれを優先する。
 */
const {
  createRunOncePlugin,
  withProjectBuildGradle,
} = require("expo/config-plugins");

const PLAY_BILLING_SDK_VERSION = "8.0.0";

const MARKER = "playBillingSdkVersion";

function withPlayBillingSdkVersion(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      return cfg;
    }

    let contents = cfg.modResults.contents;
    if (contents.includes(`${MARKER} = "${PLAY_BILLING_SDK_VERSION}"`)) {
      return cfg;
    }

    // 既存の ext { ... } に追記、なければ buildscript の前に追加
    if (/ext\s*\{/.test(contents)) {
      contents = contents.replace(
        /ext\s*\{/,
        `ext {\n    ${MARKER} = "${PLAY_BILLING_SDK_VERSION}"`
      );
    } else {
      contents = `ext {\n    ${MARKER} = "${PLAY_BILLING_SDK_VERSION}"\n}\n\n${contents}`;
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = createRunOncePlugin(
  withPlayBillingSdkVersion,
  "withPlayBillingSdkVersion",
  "1.0.0"
);
