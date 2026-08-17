import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(
  repositoryRoot,
  "lib/profile/proSkinMilestoneCatalog.ts"
);
const targetDir = resolve(repositoryRoot, "functions/src/profile");
const targetPath = resolve(targetDir, "proSkinMilestoneCatalog.ts");

await mkdir(targetDir, { recursive: true });
const source = await readFile(sourcePath, "utf8");
const header =
  "// synced from lib/profile/proSkinMilestoneCatalog.ts — run npm run sync:pro-skin-milestone-catalog\n";
await writeFile(targetPath, `${header}${source}`);
console.log("Synced proSkinMilestoneCatalog.ts → functions/src/profile/");
