/**
 * RN 0.81+ 向け react-native-iap パッチ。
 * - iOS: RCT-Folly 単体 Pod が無く pod install が失敗するため podspec を更新
 * - Android: currentActivity が解決できず Kotlin コンパイルが落ちるため修正
 * npm install 後に適用する。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function patchPodspec() {
  const podspecPath = path.join(root, "node_modules/react-native-iap/RNIap.podspec");
  if (!existsSync(podspecPath)) return;

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
    return;
  }

  src = src.replace(
    /  # Don't install the dependencies[\s\S]*?s\.dependency "ReactCommon\/turbomodule\/core"\s*\n  end/m,
    patchedBlock
  );

  writeFileSync(podspecPath, src);
  console.log("[patch-rniap] RNIap.podspec を更新しました");
}

function patchAndroidCurrentActivity() {
  const modulePath = path.join(
    root,
    "node_modules/react-native-iap/android/src/play/java/com/dooboolab/rniap/RNIapModule.kt"
  );
  if (!existsSync(modulePath)) return;

  let src = readFileSync(modulePath, "utf8");
  if (!src.includes("val activity = currentActivity")) return;

  src = src.replace(
    "val activity = currentActivity",
    "val activity = reactContext.currentActivity"
  );
  writeFileSync(modulePath, src);
  console.log("[patch-rniap] RNIapModule.kt の currentActivity を修正しました");
}

patchPodspec();
patchAndroidCurrentActivity();
