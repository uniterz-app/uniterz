import type { CSSProperties } from "react";

/**
 * Last20 Tracker / プロフィール系カード共通の外側格子（方眼）
 */
export const PROFILE_SHELL_GRID_STYLE: CSSProperties = {
  backgroundImage: `
    linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)
  `,
  backgroundSize: "22px 22px",
};
