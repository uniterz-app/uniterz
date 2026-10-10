/**
 * eas.json の build.production.env だけで子コマンドを実行する（.env の localhost を OTA に埋め込まない）。
 *
 *   node scripts/with-production-env.mjs npx -y eas-cli@latest update --branch production ...
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const eas = JSON.parse(readFileSync(join(root, "eas.json"), "utf8"));
const productionEnv = eas.build?.production?.env ?? {};

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error("usage: node scripts/with-production-env.mjs <command> [...args]");
  process.exit(1);
}

const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.startsWith("EXPO_PUBLIC_")) delete env[key];
}
Object.assign(env, productionEnv, { EXPO_NO_DOTENV: "1" });

const result = spawnSync(cmd, args, { cwd: root, env, stdio: "inherit" });
process.exit(result.status ?? 1);
