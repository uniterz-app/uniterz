"use client";

import type { CSSProperties } from "react";

/** パレットに並べるバッジの最小形（ResolvedBadge などをそのまま渡せる） */
export type BadgePaletteItem = {
  id: string;
  title: string;
  icon?: string;
};

type Props<T extends BadgePaletteItem> = {
  badges: T[];
  variant: "web" | "mobile";
  onSelect: (badge: T) => void;
  emptyLabel: string;
};

const GRID = {
  web: { cols: 6, minRows: 5 },
  mobile: { cols: 4, minRows: 5 },
} as const;

/** 最低表示スロット数と、獲得数に応じた「＋1行の未使用枠」までの総スロット */
function computeTotalSlots(
  badgeCount: number,
  cols: number,
  minRows: number,
): number {
  const minSlots = cols * minRows;
  if (badgeCount === 0) return minSlots;
  const filledRows = Math.ceil(badgeCount / cols);
  const withPadRows = filledRows + 1;
  return Math.max(minSlots, withPadRows * cols);
}

/**
 * 獲得バッジ一覧：jewel-tray / gold-frame / velvet-grid（globals.css）
 */
export default function BadgePalette<T extends BadgePaletteItem>({
  badges,
  variant,
  onSelect,
  emptyLabel,
}: Props<T>) {
  const isWeb = variant === "web";
  const { cols, minRows } = GRID[variant];
  const totalSlots = computeTotalSlots(badges.length, cols, minRows);
  const rowCount = Math.ceil(totalSlots / cols);
  const voidCount = Math.max(0, totalSlots - badges.length);
  const nodeCount = badges.length;

  const gridStyle = {
    "--jewel-cols": cols,
    "--jewel-rows": rowCount,
  } as CSSProperties;

  const voidIndices = Array.from({ length: voidCount }, (_, i) => `void-${i}`);

  return (
    <div className={["jewel-tray", !isWeb && "jewel-tray--mobile"].filter(Boolean).join(" ")}>
      <div className="gold-frame">
        <div className="jewel-tray-meta">
          <h2>獲得バッジ</h2>
          <p>
            <span style={{ color: "rgba(255,240,234,0.95)" }}>
              {String(nodeCount).padStart(2, "0")}
            </span>
            <span style={{ color: "rgba(201,160,144,0.5)" }}> / </span>
            <span style={{ color: "rgba(201,160,144,0.65)" }}>{totalSlots}</span>
          </p>
        </div>

        {badges.length === 0 ? (
          <p className="jewel-tray-empty">{emptyLabel}</p>
        ) : null}

        <p className="sr-only">
          獲得バッジ {nodeCount} 件。未配置のスロット {voidCount} 個。
        </p>

        <ul className="velvet-grid" style={gridStyle}>
          {badges.map((b, i) => (
            <li
              key={b.id}
              className="badge-palette-slot-enter min-w-0 list-none"
              style={
                {
                  "--slot-enter-delay": `${Math.min(i, 11) * 18}ms`,
                } as CSSProperties
              }
            >
              <button
                type="button"
                onClick={() => onSelect(b)}
                title={b.title}
                className="velvet-slot velvet-slot--button h-full w-full"
              >
                {b.icon ? (
                  <img src={b.icon} alt={b.title} draggable={false} />
                ) : (
                  <span className="px-0.5 text-center text-[9px] font-medium leading-tight text-[#f0d4c8]/55 sm:text-[10px]">
                    {b.title}
                  </span>
                )}
              </button>
            </li>
          ))}
          {voidIndices.map((key) => (
            <li key={key} className="min-w-0 list-none" aria-hidden>
              <div className="velvet-slot h-full min-h-0 w-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
