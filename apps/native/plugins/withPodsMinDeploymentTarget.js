/**
 * Pods の IPHONEOS_DEPLOYMENT_TARGET を 15.1 未満なら 15.1 に揃える。
 * Xcode 27 は 15.0 未満のターゲットを archive エラーにする（ReachabilitySwift / RNSVG / AsyncStorage の resource bundle が 12〜13 のまま）。
 */
const fs = require("fs");
const path = require("path");
const { createRunOncePlugin, withDangerousMod } = require("expo/config-plugins");

const MIN_TARGET = "15.1";
const MARKER = "# withPodsMinDeploymentTarget";

const SNIPPET = `
    ${MARKER}
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |bc|
        cur = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if cur.nil? || Gem::Version.new(cur) < Gem::Version.new('${MIN_TARGET}')
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_TARGET}'
        end
      end
    end
`;

function withPodsMinDeploymentTarget(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");
      if (contents.includes(MARKER)) return cfg;
      const afterRnPostInstall = /react_native_post_install\([\s\S]*?\n\s*\)\n/;
      const postInstallOpen = /post_install do \|installer\|\n/;
      if (afterRnPostInstall.test(contents)) {
        contents = contents.replace(afterRnPostInstall, (m) => m + SNIPPET);
      } else if (postInstallOpen.test(contents)) {
        contents = contents.replace(postInstallOpen, (m) => m + SNIPPET);
      } else {
        throw new Error("[withPodsMinDeploymentTarget] Podfile に post_install がありません");
      }
      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
}

module.exports = createRunOncePlugin(
  withPodsMinDeploymentTarget,
  "withPodsMinDeploymentTarget",
  "1.0.0"
);
