/**
 * @react-navigation/bottom-tabs: タブのスライド（native driver）完了時に各タブの位置を最終値で setValue し直す。
 * 新アーキで、アニメ開始と同時に描画・再アタッチされたタブ画面が native 側で横にずれたまま残り、
 * タブを切り替えても画面が出ない（別タブを経由すると直る）ことがある。
 * finished のときだけ（途中打ち切りで次のスライドを止めないため）。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = path.join(root, "node_modules/@react-navigation/bottom-tabs");
const MARKER = "uniterz: settle tab positions";

const targets = [
  {
    file: path.join(pkg, "lib/module/views/BottomTabView.js"),
    find: `.start(({
        finished
      }) => {`,
  },
  {
    file: path.join(pkg, "src/views/BottomTabView.tsx"),
    find: `.start(({ finished }) => {`,
  },
];

const settle = `
        // ${MARKER}
        if (finished) {
          state.routes.forEach((route, index) => {
            tabAnims[route.key]?.setValue(
              index === state.index ? 0 : index >= state.index ? 1 : -1
            );
          });
        }`;

for (const { file, find } of targets) {
  if (!existsSync(file)) continue;
  const src = readFileSync(file, "utf8");
  if (src.includes(MARKER)) continue;
  if (!src.includes(find)) {
    console.warn(`[patch-bottom-tabs-settle] 対象が見つかりません: ${path.relative(root, file)}`);
    continue;
  }
  writeFileSync(file, src.replace(find, find + settle));
  console.log(`[patch-bottom-tabs-settle] ${path.relative(root, file)}`);
}
