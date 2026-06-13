"use client";

import { forwardRef, type ReactNode, type Ref } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
};

function FrameCorners() {
  return (
    <>
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
    </>
  );
}

const ProfileKinetikPanelFrame = forwardRef<HTMLElement, Props>(
  function ProfileKinetikPanelFrame(
    { children, className = "", as: frameTag = "div" },
    ref
  ) {
    const frameClass = ["profile-kinetik-panel min-w-0", className]
      .filter(Boolean)
      .join(" ");

    if (frameTag === "section") {
      return (
        <section ref={ref} className={frameClass}>
          <FrameCorners />
          {children}
        </section>
      );
    }

    return (
      <div ref={ref as Ref<HTMLDivElement>} className={frameClass}>
        <FrameCorners />
        {children}
      </div>
    );
  }
);

export default ProfileKinetikPanelFrame;
