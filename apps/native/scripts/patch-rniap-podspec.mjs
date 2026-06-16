/**
 * RN 0.81+ / New Arch では RCT-Folly が単体 Pod になく、RNIap の pod install が失敗するためパッチ。
 * npm install 後に適用する。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const podspecPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../node_modules/react-native-iap/RNIap.podspec"
);

const patchedBlock = `  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig = {
      "HEADER_SEARCH_PATHS" => "\\"$(PODS_ROOT)/boost\\"",
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    }
    install_modules_dependencies(s)
  end`;

let src = readFileSync(podspecPath, "utf8");
if (src.includes("install_modules_dependencies(s)") && !src.includes('s.dependency "RCT-Folly"')) {
  process.exit(0);
}

src = src.replace(
  /  # Don't install the dependencies[\s\S]*?s\.dependency "ReactCommon\/turbomodule\/core"\s*\n  end/m,
  patchedBlock
);

writeFileSync(podspecPath, src);
console.log("[patch-rniap-podspec] RNIap.podspec を更新しました");
