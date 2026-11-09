import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(repositoryRoot, "lib/badges/monthlyRankingBadge.ts");
const targetDir = resolve(repositoryRoot, "functions/src/badges");
const targetPath = resolve(targetDir, "monthlyRankingBadge.ts");

await mkdir(targetDir, { recursive: true });
const source = await readFile(sourcePath, "utf8");
if (/^import /m.test(source)) {
  throw new Error("lib/badges/monthlyRankingBadge.ts must not import anything (Functions cannot resolve it)");
}
const header =
  "// synced from lib/badges/monthlyRankingBadge.ts — run npm run sync:monthly-ranking-badge\n";
await writeFile(targetPath, `${header}${source}`);
console.log("Synced monthlyRankingBadge.ts → functions/src/badges/");
