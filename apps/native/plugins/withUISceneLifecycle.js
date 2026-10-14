/**
 * iOS 27 SDK（Xcode 27）でビルドしたアプリは UIScene ライフサイクルが無いと起動直後にクラッシュする。
 * `ios/` は gitignore で EAS（--local 含む）が毎回 prebuild し直すため、ここで毎回入れる:
 * - AppDelegate.swift → `templates/AppDelegate.swift`（SceneDelegate で窓と RN を起動）
 * - Info.plist → UIApplicationSceneManifest
 */
const fs = require("fs");
const path = require("path");
const {
  createRunOncePlugin,
  withAppDelegate,
  withInfoPlist,
} = require("expo/config-plugins");

const TEMPLATE = path.join(__dirname, "templates", "AppDelegate.swift");

function withUISceneLifecycle(config) {
  config = withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== "swift") {
      throw new Error("[withUISceneLifecycle] Swift の AppDelegate を想定しています");
    }
    cfg.modResults.contents = fs.readFileSync(TEMPLATE, "utf8");
    return cfg;
  });
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
          },
        ],
      },
    };
    return cfg;
  });
  return config;
}

module.exports = createRunOncePlugin(
  withUISceneLifecycle,
  "withUISceneLifecycle",
  "1.0.0"
);
