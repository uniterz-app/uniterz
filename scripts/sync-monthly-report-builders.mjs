import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  ".."
);
const sourceDir = resolve(repositoryRoot, "lib/reports");
const targetDir = resolve(repositoryRoot, "functions/src/reports");

const BUILDERS = [
  "buildMonthlyHabits.ts",
  "buildMonthlyHighlights.ts",
  "buildMonthlyOutlookSummary.ts",
  "buildMonthlyTeamAffinity.ts",
  "monthlyRadarJudge.ts",
];

function rewriteForFunctions(source) {
  return source
    .replaceAll(
      "@/lib/reports/monthlyReportTypes",
      "./monthlyReportTypes"
    )
    .replaceAll(
      "@/lib/reports/monthlyRadarJudge",
      "./monthlyRadarJudge"
    )
    .replaceAll("@/shared/analysis/types", "../stats/analysis/types");
}

await mkdir(targetDir, { recursive: true });

for (const fileName of BUILDERS) {
  const sourcePath = resolve(sourceDir, fileName);
  const targetPath = resolve(targetDir, fileName);
  const source = await readFile(sourcePath, "utf8");
  const header = `// synced from lib/reports/${fileName} — run npm run sync:monthly-report-builders\n`;

  await writeFile(targetPath, `${header}${rewriteForFunctions(source)}`);
}

// The generated builders share these contract types. Keep their definitions
// aligned with the same source rather than maintaining a second hand-written copy.
const typesPath = resolve(sourceDir, "monthlyReportTypes.ts");
await writeFile(
  resolve(targetDir, "monthlyReportTypes.ts"),
  rewriteForFunctions(await readFile(typesPath, "utf8"))
);

console.log(`Synced ${BUILDERS.length} monthly report builders.`);
