"use client";

import { forwardRef, type ElementType, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
};

const ProfileKinetikPanelFrame = forwardRef<HTMLElement, Props>(function ProfileKinetikPanelFrame(
  { children, className = "", as: Tag = "div" },
  ref
) {
  return (
    <Tag
      ref={ref}
      className={["profile-kinetik-panel min-w-0", className].filter(Boolean).join(" ")}
    >
      <span
        className="profile-kinetik-frame-corner profile-kinetik-frame-corner--tl"
        aria-hidden
      />
      <span
        className="profile-kinetik-frame-corner profile-kinetik-frame-corner--tr"
        aria-hidden
      />
      <span
        className="profile-kinetik-frame-corner profile-kinetik-frame-corner--bl"
        aria-hidden
      />
      <span
        className="profile-kinetik-frame-corner profile-kinetik-frame-corner--br"
        aria-hidden
      />
      {children}
    </Tag>
  );
});

export default ProfileKinetikPanelFrame;
