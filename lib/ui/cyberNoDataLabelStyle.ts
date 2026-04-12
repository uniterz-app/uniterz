import type { CSSProperties } from "react";

/** プレーオフ見出し（PLAYOFFS BRACKET 等）と揃えたシアン */
export const CYBER_NO_DATA_COLOR = "#38bdf8";

export const CYBER_NO_DATA_TEXT_SHADOW =
  "0 0 10px rgba(56,189,248,0.45), 0 0 22px rgba(56,189,248,0.32), 0 0 44px rgba(56,189,248,0.2), 0 0 72px rgba(56,189,248,0.12)";

/** 空状態「NO DATA」用（色・グローを一箇所で統一） */
export const cyberNoDataLabelStyle: CSSProperties = {
  color: CYBER_NO_DATA_COLOR,
  textShadow: CYBER_NO_DATA_TEXT_SHADOW,
};
