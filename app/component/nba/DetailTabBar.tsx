"use client";

/**
 * チーム詳細 / プレイヤー詳細のタブ。Native `DetailTabBarNative` 相当。
 * 本体がスクロールで隠れたら、ページ見出しの直下に名前 + タブを固定表示する
 * （シェルの `overflow-x-hidden` で sticky が効かないため fixed で出す）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import { nameOxanium } from "@/lib/fonts";
import {
  nbaDetailTabLabel,
  type NbaPlayerDetailTab,
  type NbaTeamDetailTab,
} from "@/lib/nba/detailTabs";

type Props<T extends NbaTeamDetailTab | NbaPlayerDetailTab> = {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  /** 固定表示中に左上へ出す名前（チーム名・選手名） */
  pinnedTitle: string;
  pinnedTag?: string | null;
  /** チームカラー（タブの塗り・枠・固定バーの線） */
  accent: string;
};

const PAGE_HEADER_SELECTOR = "[data-cyber-subpage-header]";

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function pageHeaderBottom(): number {
  const header = document.querySelector<HTMLElement>(PAGE_HEADER_SELECTOR);
  return header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
}

export default function DetailTabBar<T extends NbaTeamDetailTab | NbaPlayerDetailTab>({
  tabs,
  active,
  onChange,
  pinnedTitle,
  pinnedTag,
  accent,
}: Props<T>) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pinnedTop, setPinnedTop] = useState<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = anchorRef.current;
      if (!el) return;
      const headerBottom = pageHeaderBottom();
      const pinned = el.getBoundingClientRect().top < headerBottom;
      setPinnedTop((prev) => {
        const next = pinned ? headerBottom : null;
        return prev === next ? prev : next;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const select = useCallback(
    (tab: T) => {
      if (tab === active) return;
      onChange(tab);
      const el = anchorRef.current;
      if (!el) return;
      const headerBottom = pageHeaderBottom();
      const top = el.getBoundingClientRect().top;
      if (top < headerBottom) {
        window.scrollTo({ top: window.scrollY + top - headerBottom - 8 });
      }
    },
    [active, onChange]
  );

  const theme = useMemo(
    () => ({
      accent,
      activeShadow: `0 0 10px ${hexToRgba(accent, 0.55)}, 0 0 22px ${hexToRgba(accent, 0.28)}`,
    }),
    [accent]
  );

  const bar = (
    <CyberSlantedTabBar fill aria-label="Detail sections">
      {tabs.map((tab) => (
        <CyberSlantedTab
          key={tab}
          label={nbaDetailTabLabel(tab)}
          active={tab === active}
          onClick={() => select(tab)}
          compact
          theme={theme}
          role="tab"
          aria-selected={tab === active}
        />
      ))}
    </CyberSlantedTabBar>
  );

  return (
    <>
      <div ref={anchorRef}>{bar}</div>
      {pinnedTop != null && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-x-0 z-40 border-b bg-[rgba(5,5,8,0.95)]"
              style={{ top: pinnedTop, borderColor: accent }}
            >
              <div className="mx-auto w-full max-w-lg px-3 pt-2">
                <div className="flex min-w-0 items-center gap-2">
                  <p
                    className={`${nameOxanium.className} min-w-0 truncate text-[13px] font-extrabold uppercase tracking-[0.06em]`}
                    style={{ color: accent, transform: "skewX(-6deg)" }}
                  >
                    {pinnedTitle}
                  </p>
                  {pinnedTag ? (
                    <span
                      className={`${nameOxanium.className} shrink-0 text-[11px] font-extrabold tracking-[0.06em] text-white/60`}
                    >
                      {pinnedTag}
                    </span>
                  ) : null}
                </div>
                {bar}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
