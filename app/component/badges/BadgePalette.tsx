"use client";

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

/** カットコーナー（モジュール挿槽）— web は角を大きめ */
function slotClipPath(isWeb: boolean): string {
  const c = isWeb ? 14 : 10;
  return `polygon(${c}px 0,calc(100% - ${c}px) 0,100% ${c}px,100% calc(100% - ${c}px),calc(100% - ${c}px) 100%,${c}px 100%,0 calc(100% - ${c}px),0 ${c}px)`;
}

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
 * 獲得バッジ一覧用：控えめなネオン枠・グリッド・未配置は無装飾のリセス
 */
export default function BadgePalette<T extends BadgePaletteItem>({
  badges,
  variant,
  onSelect,
  emptyLabel,
}: Props<T>) {
  const isWeb = variant === "web";
  const clip = slotClipPath(isWeb);
  const cols = isWeb ? 8 : 4;
  const minRows = isWeb ? 2 : 4;
  const totalSlots = computeTotalSlots(badges.length, cols, minRows);
  const voidCount = Math.max(0, totalSlots - badges.length);

  const innerPad = isWeb ? "p-6 sm:p-8" : "p-4 sm:p-5";
  const gridClass = isWeb
    ? "grid grid-cols-8 gap-4 sm:gap-5"
    : "grid grid-cols-4 gap-3 sm:gap-4";
  const gemRounded = isWeb ? "rounded-[10px]" : "rounded-lg";
  const outerRounded = "rounded-[28px] sm:rounded-[30px]";
  const innerClip = "rounded-[26px] sm:rounded-[28px]";
  const slotPerspective = isWeb ? "720px" : "560px";
  const slotHoverTf =
    "hover:[transform:rotateX(8deg)_translateY(-4px)_translateZ(6px)]";
  const slotFocusTf =
    "focus-visible:[transform:rotateX(6deg)_translateY(-2px)_translateZ(4px)]";
  const slotActiveTf =
    "active:[transform:rotateX(3deg)_translateY(0)_translateZ(0)]";

  const nodeCount = badges.length;

  const voidIndices = Array.from({ length: voidCount }, (_, i) => `void-${i}`);

  return (
    // 外周：稀なクロームグリッチ＋外側グロー
    <div
      className={[
        "badge-palette-chrome-glitch relative",
        outerRounded,
        "shadow-[0_28px_64px_rgba(0,0,0,0.72),0_0_0_1px_rgba(34,211,238,0.12),0_0_60px_rgba(139,92,246,0.12),0_0_100px_rgba(34,211,238,0.06)]",
      ].join(" ")}
    >
      {/* 2px リング：背面のコニックが回転 */}
      <div
        className={[
          "relative overflow-hidden",
          outerRounded,
          "p-[2px]",
        ].join(" ")}
      >
        <div
          className="badge-palette-orbit pointer-events-none z-0 opacity-[0.55] sm:opacity-[0.62]"
          aria-hidden
        />

        <div
          className={[
            "relative z-[1] overflow-hidden",
            innerClip,
            "bg-[#030709]",
          ].join(" ")}
        >
          <div
            className={[
              "badge-palette-shell cyber-card relative isolate",
              innerPad,
              "bg-[radial-gradient(ellipse_100%_80%_at_50%_-10%,rgba(34,211,238,0.14)_0%,transparent_45%),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(139,92,246,0.12)_0%,transparent_50%),linear-gradient(168deg,#020608_0%,#0b1522_38%,#050a10_100%)]",
              "shadow-[inset_0_0_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)]",
            ].join(" ")}
          >
            <div
              className="badge-palette-diagonal-hatch pointer-events-none absolute inset-0 z-0 opacity-45"
              aria-hidden
            />
            <div
              className="splash-cyber-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14]"
              aria-hidden
            />
            <div
              className="splash-cyber-scanlines pointer-events-none absolute inset-0 z-0 mix-blend-overlay opacity-[0.18]"
              aria-hidden
            />

            {/* 縦方向に移動する走査ビーム */}
            <div className="badge-palette-beam" aria-hidden />

            {/* 上段：タイトルと件数のみ（装飾文案は抑える） */}
            <div
              className={[
                "relative z-[3] mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] pb-3 sm:mb-6",
                isWeb ? "sm:pb-4" : "",
              ].join(" ")}
            >
              <h2 className="min-w-0 text-lg font-semibold tracking-tight text-white/90 sm:text-xl">
                獲得バッジ
              </h2>
              <p className="shrink-0 font-mono text-sm tabular-nums tracking-tight text-cyan-200/70 sm:text-base">
                <span className="text-white/90">
                  {String(nodeCount).padStart(2, "0")}
                </span>
                <span className="text-white/35"> / </span>
                <span className="text-white/45">{totalSlots}</span>
              </p>
            </div>

            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px bg-linear-to-r from-transparent via-cyan-300/60 to-transparent"
              aria-hidden
            />

            <div
              className="splash-cyber-corner pointer-events-none absolute left-2 top-2 z-[2] h-7 w-7 rounded-tl border-l border-t border-cyan-400/30 sm:left-3 sm:top-3 sm:h-8 sm:w-8"
              style={{ animationDelay: "0s" }}
              aria-hidden
            />
            <div
              className="splash-cyber-corner pointer-events-none absolute right-2 top-2 z-[2] h-7 w-7 rounded-tr border-r border-t border-cyan-400/30 sm:right-3 sm:top-3 sm:h-8 sm:w-8"
              style={{ animationDelay: "0.35s" }}
              aria-hidden
            />
            <div
              className="splash-cyber-corner pointer-events-none absolute bottom-2 left-2 z-[2] h-7 w-7 rounded-bl border-b border-l border-cyan-400/30 sm:bottom-3 sm:left-3 sm:h-8 sm:w-8"
              style={{ animationDelay: "0.7s" }}
              aria-hidden
            />
            <div
              className="splash-cyber-corner pointer-events-none absolute bottom-2 right-2 z-[2] h-7 w-7 rounded-br border-b border-r border-cyan-400/30 sm:bottom-3 sm:right-3 sm:h-8 sm:w-8"
              style={{ animationDelay: "1.05s" }}
              aria-hidden
            />

            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-cyan-400/[0.06] via-transparent to-violet-950/25"
              aria-hidden
            />

            <div className="relative z-10 flex flex-col gap-5 sm:gap-6">
              {badges.length === 0 && (
                <div className="text-center">
                  <p className="mx-auto font-mono text-xs tracking-[0.25em] text-cyan-300/50">
                    ─ NO_SIGNAL ─
                  </p>
                  <p
                    className={[
                      "mx-auto mt-3 max-w-md font-mono text-sm leading-relaxed tracking-wide text-cyan-100/85 sm:text-base",
                      "drop-shadow-[0_0_20px_rgba(34,211,238,0.25)]",
                    ].join(" ")}
                  >
                    {emptyLabel}
                  </p>
                </div>
              )}

              <p className="sr-only">
                獲得バッジ {nodeCount} 件。未配置のスロット {voidCount} 個。
              </p>
              <ul className={gridClass}>
                {badges.map((b, i) => (
                  <li
                    key={b.id}
                    className="badge-palette-slot-enter min-w-0"
                    style={{
                      perspective: slotPerspective,
                      animationDelay: `${Math.min(i, 40) * 28}ms`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(b)}
                      title={b.title}
                      style={{
                        transformStyle: "preserve-3d",
                        clipPath: clip,
                      }}
                      className={[
                        "badge-palette-slot group relative flex w-full flex-col items-stretch overflow-hidden outline-none",
                        "aspect-square",
                        "transition-[transform,box-shadow,filter] duration-200 ease-out motion-reduce:transition-none",
                        "hover:shadow-[0_16px_48px_rgba(34,211,238,0.22),0_0_0_1px_rgba(103,232,249,0.45),0_0_32px_rgba(139,92,246,0.15)]",
                        "hover:brightness-110",
                        slotHoverTf,
                        slotFocusTf,
                        slotActiveTf,
                        "motion-reduce:hover:transform-none motion-reduce:focus-visible:transform-none motion-reduce:hover:brightness-100",
                        "focus-visible:ring-2 focus-visible:ring-cyan-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030709]",
                        "border border-cyan-400/22",
                        "bg-[linear-gradient(165deg,rgba(15,30,42,0.98)_0%,rgba(2,4,8,0.99)_55%,rgba(8,12,22,0.98)_100%)]",
                        "shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12),inset_0_-20px_40px_rgba(0,0,0,0.65),0_4px_24px_rgba(0,0,0,0.45)]",
                        "p-1.5 sm:p-2",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "relative flex min-h-0 flex-1 overflow-hidden",
                          gemRounded,
                          "ring-1 ring-cyan-300/30 ring-inset",
                          "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.6),0_0_22px_rgba(34,211,238,0.14)]",
                          "bg-[radial-gradient(circle_at_50%_32%,rgba(20,55,72,0.95)_0%,rgba(3,6,12,0.99)_100%)]",
                        ].join(" ")}
                      >
                        {b.icon ? (
                          <img
                            src={b.icon}
                            alt={b.title}
                            className={[
                              "h-full w-full object-cover",
                              "transition-transform duration-200 ease-out motion-reduce:transition-none",
                              "group-hover:scale-[1.06]",
                            ].join(" ")}
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center px-0.5 text-center text-[10px] font-medium leading-tight text-cyan-100/60 sm:text-[11px]">
                            {b.title}
                          </span>
                        )}
                        <span
                          className={[
                            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 motion-reduce:transition-none",
                            "bg-gradient-to-br from-cyan-200/25 via-transparent to-violet-400/10",
                            "group-hover:opacity-100 group-focus-visible:opacity-100",
                          ].join(" ")}
                          aria-hidden
                        />
                      </span>
                    </button>
                  </li>
                ))}
                {voidIndices.map((key, vi) => (
                  <li
                    key={key}
                    className="badge-palette-slot-enter min-w-0"
                    style={{
                      perspective: slotPerspective,
                      animationDelay: `${Math.min(badges.length + vi, 40) * 28}ms`,
                    }}
                  >
                    {/* 未配置：シアン装飾なしの無地リセス（グリッドのノイズを減らす） */}
                    <div
                      style={{ clipPath: clip }}
                      className={[
                        "relative aspect-square w-full overflow-hidden",
                        "border border-white/[0.06]",
                        "bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_22%,rgba(0,0,0,0.5)_100%)]",
                        "shadow-[inset_0_2px_16px_rgba(0,0,0,0.65),inset_0_-1px_0_rgba(255,255,255,0.03)]",
                        "p-1.5 sm:p-2",
                      ].join(" ")}
                      aria-hidden
                    >
                      <div
                        className={[
                          "h-full min-h-0 w-full",
                          gemRounded,
                          "bg-black/35",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-8px_24px_rgba(0,0,0,0.55)]",
                        ].join(" ")}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
