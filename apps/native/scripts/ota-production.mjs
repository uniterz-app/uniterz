/**
 * 本番 OTA（iOS + Android）。eas.json の build.production.env だけで書き出し、
 * バンドルに localhost / LAN IP が入っていたら公開しない。
 *
 *   npm run ota:production -- --message "変更内容"
 *   npm run ota:production -- --check-only   # 検査だけ（公開しない）
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const eas = JSON.parse(readFileSync(join(root, "eas.json"), "utf8"));
const productionEnv = eas.build?.production?.env ?? {};
const checkOnly = process.argv.includes("--check-only");
const extraArgs = process.argv.slice(2).filter((a) => a !== "--check-only");

if (!checkOnly && !extraArgs.includes("--message")) {
  console.error('[ota] --message "変更内容" を付けてください');
  process.exit(1);
}
if (!/^https:\/\//.test(String(productionEnv.EXPO_PUBLIC_UNITERZ_API_BASE_URL ?? ""))) {
  console.error("[ota] eas.json build.production.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL が https ではありません");
  process.exit(1);
}

const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.startsWith("EXPO_PUBLIC_")) delete env[key];
}
Object.assign(env, productionEnv, { EXPO_NO_DOTENV: "1", NODE_ENV: "production" });

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, env, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function bundleFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...bundleFiles(p));
    else if (/\.(hbc|js)$/.test(name)) out.push(p);
  }
  return out;
}

const FORBIDDEN = [
  /https?:\/\/localhost[:/]/,
  /https?:\/\/127\.0\.0\.1/,
  /https?:\/\/10\.\d+\.\d+\.\d+/,
  /https?:\/\/192\.168\.\d+\.\d+/,
  /https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/,
];

function scan(dir) {
  const hits = [];
  for (const file of bundleFiles(dir)) {
    const text = readFileSync(file).toString("latin1");
    for (const re of FORBIDDEN) {
      const m = text.match(re);
      if (m) hits.push(`${file.replace(dir, "")}: ${m[0]}`);
    }
  }
  return hits;
}

/** Metro のキャッシュは EXPO_PUBLIC_* の値が変わっても古い inline を返すことがあるため常に --clear */
const outDir = mkdtempSync(join(tmpdir(), "uniterz-ota-"));
try {
  console.log("[ota] 事前書き出し（検査用）…");
  run("npx", [
    "expo",
    "export",
    "--platform",
    "ios",
    "--platform",
    "android",
    "--output-dir",
    outDir,
    "--clear",
  ]);
  const hits = scan(outDir);
  if (hits.length > 0) {
    console.error("[ota] バンドルに開発用 URL が入っています。公開を中止しました:\n" + hits.join("\n"));
    process.exit(1);
  }
  console.log("[ota] 検査 OK（localhost / LAN IP なし）");
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
if (checkOnly) process.exit(0);

run("npx", [
  "-y",
  "eas-cli@latest",
  "update",
  "--branch",
  "production",
  "--platform",
  "all",
  "--non-interactive",
  "--clear-cache",
  ...extraArgs,
]);

const published = scan(join(root, "dist"));
if (published.length > 0) {
  console.error(
    "[ota] !!! 公開したバンドルに開発用 URL が入っています。すぐに `npx eas-cli update:rollback` か再公開してください:\n" +
      published.join("\n")
  );
  process.exit(1);
}
console.log("[ota] 公開済みバンドルも検査 OK");
