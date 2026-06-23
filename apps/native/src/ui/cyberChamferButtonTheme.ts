import {
  CYBER_CHAMFER_CLOSE_ICON,
  CYBER_CHAMFER_CLOSE_STROKE,
  CYBER_CHAMFER_DELETE_ICON,
  CYBER_CHAMFER_DELETE_STROKE,
  CYBER_CHAMFER_EDIT_ICON,
  CYBER_CHAMFER_EDIT_STROKE,
  CYBER_CHAMFER_FILL,
  CYBER_CHAMFER_ICON,
  CYBER_CHAMFER_STROKE,
} from "../../../../lib/ui/cyberChamferAccent";

/** Web `.cyber-menu-btn` 系 — アクション別に色を固定 */
export type CyberChamferAction = "menu" | "close" | "edit" | "delete" | "share";

export type CyberChamferTheme = {
  fill: string;
  stroke: string;
  icon: string;
};

const PROFILE_PURPLE_THEME: CyberChamferTheme = {
  fill: CYBER_CHAMFER_FILL,
  stroke: CYBER_CHAMFER_STROKE,
  icon: CYBER_CHAMFER_ICON,
};

export const CYBER_CHAMFER_THEMES: Record<CyberChamferAction, CyberChamferTheme> = {
  menu: PROFILE_PURPLE_THEME,
  close: {
    fill: CYBER_CHAMFER_FILL,
    stroke: CYBER_CHAMFER_CLOSE_STROKE,
    icon: CYBER_CHAMFER_CLOSE_ICON,
  },
  edit: {
    fill: CYBER_CHAMFER_FILL,
    stroke: CYBER_CHAMFER_EDIT_STROKE,
    icon: CYBER_CHAMFER_EDIT_ICON,
  },
  delete: {
    fill: CYBER_CHAMFER_FILL,
    stroke: CYBER_CHAMFER_DELETE_STROKE,
    icon: CYBER_CHAMFER_DELETE_ICON,
  },
  share: PROFILE_PURPLE_THEME,
};
