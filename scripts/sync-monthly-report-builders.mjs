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
    .replaceAll("@/lib/i18n/localize", "./localize")
    .replaceAll("@/lib/i18n/language", "./language")
    .replaceAll("@/lib/i18n/ui", "./ui")
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

// functions の tsconfig には `@/` エイリアスがないため、builder が使う 7 言語ヘルパーも
// 同じ単一ソースから複製する。
const I18N_HELPERS = [
  ["lib/i18n/language.ts", "language.ts"],
  ["lib/i18n/ui.ts", "ui.ts"],
  ["lib/i18n/localize.ts", "localize.ts"],
];

for (const [sourceRelPath, fileName] of I18N_HELPERS) {
  const source = await readFile(resolve(repositoryRoot, sourceRelPath), "utf8");
  const header = `// synced from ${sourceRelPath} — run npm run sync:monthly-report-builders\n`;
  await writeFile(
    resolve(targetDir, fileName),
    `${header}${rewriteForFunctions(source)}`
  );
}

console.log(
  `Synced ${BUILDERS.length} monthly report builders and ${I18N_HELPERS.length} i18n helpers.`
);
