/**
 * Xcode 27 UIScene: expo-dev-launcher が didFinishLaunching で keyWindow を要求して fatalError するのを緩和。
 * 窓は SceneDelegate 側で autoSetupStart する。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(
  root,
  "node_modules/expo-dev-launcher/ios/ReactDelegateHandler/ExpoDevLauncherAppDelegateSubscriber.swift"
);
const MARKER = "Xcode 27 UIScene: window is created in SceneDelegate";

const patched = `// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoDevLauncherAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    // ${MARKER}
    // Do not fatalError here — SceneDelegate will call autoSetupStart(window).
    guard let window = UIApplication.shared.delegate?.window ?? UIApplication.shared.windows.filter({ $0.isKeyWindow }).first else {
      return false
    }
    EXDevLauncherController.sharedInstance().autoSetupStart(window)
    return false
  }

  public func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return EXDevLauncherController.sharedInstance().onDeepLink(url, options: options)
  }
}
`;

if (!existsSync(target)) process.exit(0);
const current = readFileSync(target, "utf8");
if (current.includes(MARKER)) process.exit(0);
writeFileSync(target, patched);
console.log("[patch-expo-dev-launcher-uiscene] ExpoDevLauncherAppDelegateSubscriber を緩和しました");
