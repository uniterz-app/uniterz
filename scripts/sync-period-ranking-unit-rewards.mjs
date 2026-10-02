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
let source = await readFile(sourcePath, "utf8");

// Functions は @/lib/i18n を解決できない。UI ラベル（METRIC_LABELS 以降）は Web 専用なので落とす。
source = source
  .replace(
    /^import \{ L, type LocalizedLang \} from "@\/lib\/i18n\/localize";\n/m,
    ""
  )
  .replace(/^import type \{ UiStrings \} from "@\/lib\/i18n\/ui";\n\n/m, "")
  .replace(/\nconst METRIC_LABELS:[\s\S]*$/m, "\n");

const header =
  "// synced from lib/units/periodRankingUnitRewards.ts — run npm run sync:period-ranking-unit-rewards\n";
await writeFile(targetPath, `${header}${source}`);
console.log("Synced periodRankingUnitRewards.ts → functions/src/units/");
