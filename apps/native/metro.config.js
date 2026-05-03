const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// monorepo 配下の packages を解決できるようにする
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// 同一ネイティブモジュールの二重解決を防ぐ
// idb は Firebase の間接依存で、monorepo だとルートにだけ入り Metro が誤パスを開くことがある
function resolvePackageDir(name) {
  const inProject = path.join(projectRoot, "node_modules", name);
  if (fs.existsSync(path.join(inProject, "package.json"))) return inProject;
  const inWorkspace = path.join(workspaceRoot, "node_modules", name);
  if (fs.existsSync(path.join(inWorkspace, "package.json"))) return inWorkspace;
  return inProject;
}
config.resolver.extraNodeModules = {
  "react-native-svg": path.resolve(projectRoot, "node_modules/react-native-svg"),
  idb: resolvePackageDir("idb"),
  // monorepo で JS だけルート側に寄るとネイティブとズレるのを防ぐ
  "@react-native-async-storage/async-storage": path.join(
    projectRoot,
    "node_modules",
    "@react-native-async-storage",
    "async-storage"
  ),
  // Reanimated の Babel プラグインとランタイムを同一パッケージに固定（バージョン不一致防止）
  "react-native-worklets": path.join(projectRoot, "node_modules", "react-native-worklets"),
};
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
