"use client";

/**
 * Games 右端 — STANDING / STATS / TODAY の縦タブ。
 * STATS の位置は従来どおり（レール自体が 46% 中央）。STANDING は上、TODAY は下に積む。
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import cn from "clsx";
import ProfileMenuEdgeHandle from "@/app/component/profile/ui/ProfileMenuEdgeHandle";

const EDGE_START_PX = 28;
const OPEN_DX_PX = 48;
const CANCEL_DY_PX = 40;

type Props = {
  onOpenStanding: () => void;
  onOpenStats: () => void;
  onOpenToday?: () => void;
  standingAriaLabel?: string;
  statsAriaLabel?: string;
  todayAriaLabel?: string;
  hidden?: boolean;
  fadeIn?: boolean;
  statsTutorialTargetId?: string;
};

export default function GamesRightEdgeTabs({
  onOpenStanding,
  onOpenStats,
  onOpenToday,
  standingAriaLabel = "STANDING",
  statsAriaLabel = "STATS",
  todayAriaLabel = "TODAY",
  hidden = false,
  fadeIn = false,
  statsTutorialTargetId,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hidden) return;
    let tracking = false;
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (t.clientX >= window.innerWidth - EDGE_START_PX) {
        tracking = true;
        startX = t.clientX;
        startY = t.clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dy > CANCEL_DY_PX) {
        tracking = false;
        return;
      }
      if (dx < -OPEN_DX_PX) {
        tracking = false;
        onOpenStats();
      }
    };
    const onTouchEnd = () => {
      tracking = false;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [hidden, onOpenStats]);

  if (!mounted) return null;

  const show = !hidden;

  return createPortal(
    <div
      className={cn(
        "games-right-edge-tabs",
        fadeIn && "games-right-edge-tabs--fade",
        !show && "games-right-edge-tabs--hidden"
      )}
      aria-hidden={!show}
      {...(statsTutorialTargetId && show
        ? { "data-tutorial-target": statsTutorialTargetId }
        : {})}
    >
      <div className="games-right-edge-tabs__standing">
        <ProfileMenuEdgeHandle
          inline
          label="STANDING"
          onOpen={onOpenStanding}
          ariaLabel={standingAriaLabel}
        />
      </div>
      <div className="games-right-edge-tabs__stats">
        <ProfileMenuEdgeHandle
          inline
          label="STATS"
          onOpen={onOpenStats}
          ariaLabel={statsAriaLabel}
        />
      </div>
      {onOpenToday ? (
        <div className="games-right-edge-tabs__today">
          <ProfileMenuEdgeHandle
            inline
            label="TODAY"
            onOpen={onOpenToday}
            ariaLabel={todayAriaLabel}
          />
        </div>
      ) : null}
    </div>,
    document.body
  );
}
