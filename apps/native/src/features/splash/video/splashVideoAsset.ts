/**
 * 起動スプラッシュ動画アセット。
 * AE / Blender 完成品は `assets/video/uniterz-splash.mp4` を上書きする。
 */
import { APP_MESH_BG_FALLBACK } from "../../../../../../lib/app/appMeshBackground";

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const UNITERZ_SPLASH_VIDEO = require("../../../../assets/video/uniterz-splash.mp4");

/**
 * 動画終端・継ぎ目色。試合ページの app-mesh フォールバックと同色。
 * フェードでは単色板を出さず、下の Games メッシュを透かす。
 */
export const SPLASH_VIDEO_END_BG = APP_MESH_BG_FALLBACK;

/** OS スプラッシュ / 動画開始色 */
export const SPLASH_VIDEO_START_BG = "#041418";
