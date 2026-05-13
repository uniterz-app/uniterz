const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const metroResolve = require("metro-resolver").resolve;

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

// Next.js の tsconfig paths（@/*）と同じ解決。共有 lib / app を @/ から import できるようにする
const SRC_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json", ".mjs", ".cjs"];

function resolveSourceFile(basePathWithoutExt) {
  for (const ext of SRC_EXTENSIONS) {
    const withExt = basePathWithoutExt + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) return withExt;
  }
  for (const ext of SRC_EXTENSIONS) {
    const indexPath = path.join(basePathWithoutExt, `index${ext}`);
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) return indexPath;
  }
  return null;
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (typeof moduleName === "string" && moduleName.startsWith("@/")) {
    const sub = moduleName.slice(2);
    const absoluteBase =
      sub.startsWith("shared/") || sub === "shared"
        ? path.join(workspaceRoot, "app", sub)
        : path.join(workspaceRoot, sub);
    const filePath = resolveSourceFile(absoluteBase);
    if (filePath) {
      return { type: "sourceFile", filePath };
    }
  }
  // カスタム resolveRequest からビルトインへ渡す（無限再帰を避ける）
  return metroResolve(
    { ...context, resolveRequest: metroResolve },
    moduleName,
    platform
  );
};

module.exports = config;
