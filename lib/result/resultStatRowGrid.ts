/**
 * リザルト指標行：ラベル列を固定幅にしてバー開始位置を揃える。
 * minmax(0, …) だと行ごとにラベル幅で列が縮み、バー左端がずれる。
 */
export const RESULT_STAT_ROW_GRID_COMPACT =
  "grid grid-cols-[5rem_minmax(0,1fr)_1.75rem] items-center gap-x-1.5";

export const RESULT_STAT_ROW_GRID_DEFAULT =
  "grid grid-cols-[8rem_minmax(0,1fr)_3rem] items-center gap-x-2.5 sm:gap-x-3";
