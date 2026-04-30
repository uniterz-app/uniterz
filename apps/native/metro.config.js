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
config.resolver.extraNodeModules = {
  "react-native-svg": path.resolve(projectRoot, "node_modules/react-native-svg"),
};
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
