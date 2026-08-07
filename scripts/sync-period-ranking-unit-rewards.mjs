import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(
  repositoryRoot,
  "lib/units/periodRankingUnitRewards.ts"
);
const targetDir = resolve(repositoryRoot, "functions/src/units");
const targetPath = resolve(targetDir, "periodRankingUnitRewards.ts");

await mkdir(targetDir, { recursive: true });
const source = await readFile(sourcePath, "utf8");
const header =
  "// synced from lib/units/periodRankingUnitRewards.ts — run npm run sync:period-ranking-unit-rewards\n";
await writeFile(targetPath, `${header}${source}`);
console.log("Synced periodRankingUnitRewards.ts → functions/src/units/");
