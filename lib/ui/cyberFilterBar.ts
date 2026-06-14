/** 絞り込みバー（折りたたみトリガー）— globals.css `.cyber-filter-bar` */
export const CYBER_FILTER_BAR_CLASS = "cyber-filter-bar";

/** 絞り込みパネル（展開ドロップダウン）— globals.css `.cyber-filter-panel` */
export const CYBER_FILTER_PANEL_CLASS = "cyber-filter-panel";

/** アクティブな絞り込みあり */
export const CYBER_FILTER_BAR_ACTIVE_CLASS = "cyber-filter-bar--active";

export function cyberFilterBarClasses(
  active = false,
  extra = ""
): string {
  return [
    CYBER_FILTER_BAR_CLASS,
    active ? CYBER_FILTER_BAR_ACTIVE_CLASS : "",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
