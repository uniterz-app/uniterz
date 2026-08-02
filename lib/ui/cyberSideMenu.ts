/** サイドメニューパネル — 角切り（ランキング HUD と同系） */
export const CYBER_SIDE_MENU_CLIP =
  "polygon(14px 0%, calc(100% - 14px) 0%, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0% calc(100% - 14px), 0% 14px)";

/** 左端密着ドロワー — 右辺だけ角切り（浮いたカードに見えないように） */
export const CYBER_SIDE_MENU_EDGE_CLIP =
  "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)";

export const CYBER_SIDE_MENU_INNER_CLIP =
  "polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)";

/** パネル本体（globals.css の .cyber-side-menu-panel と併用） */
export const CYBER_SIDE_MENU_PANEL_CLASS = "cyber-side-menu-panel";

/** 背面グリッド（後方互換） */
export const CYBER_SIDE_MENU_GRID_CLASS = "cyber-side-menu-grid";

/** 枝分かれ線 — アンバー／ゴールド cyber（階層が読めるよう明るめ） */
export const CYBER_SIDE_MENU_BRANCH = "rgba(246, 195, 68, 0.85)";
export const CYBER_SIDE_MENU_BRANCH_GLOW = "0 0 9px rgba(246, 195, 68, 0.6)";
