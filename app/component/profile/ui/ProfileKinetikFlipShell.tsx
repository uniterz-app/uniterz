"use client";

import {
  useCallback,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { ProfileKinetikFlipEarProvider } from "@/app/component/profile/ui/ProfileKinetikFlipEar";

type Props = {
  language?: Language;
  front: ReactNode;
  back: ReactNode;
  className?: string;
};

/**
 * プロフィールカードの表裏フリップ。
 * 耳タブはカード枠側が描画する（枠の切れ込み）。
 */
export default function ProfileKinetikFlipShell({
  language = "ja",
  front,
  back,
  className = "",
}: Props) {
  const msg = t(language);
  const reduceMotion = useReducedMotion() === true;
  const [flipped, setFlipped] = useState(false);
  const panelId = useId();

  const toggle = useCallback(() => {
    setFlipped((v) => !v);
  }, []);

  const frontEar = useMemo(
    () => ({
      label: msg.profile.careerFlipToCareer,
      onToggle: toggle,
      pressed: false,
      panelId,
    }),
    [msg.profile.careerFlipToCareer, panelId, toggle]
  );

  const backEar = useMemo(
    () => ({
      label: msg.profile.careerFlipToProfile,
      onToggle: toggle,
      pressed: true,
      panelId,
    }),
    [msg.profile.careerFlipToProfile, panelId, toggle]
  );

  const sceneStyle: CSSProperties = {
    perspective: reduceMotion ? undefined : 1200,
  };

  const cardStyle: CSSProperties = reduceMotion
    ? undefined
    : {
        transformStyle: "preserve-3d",
        transition: "transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      };

  const faceBase: CSSProperties = reduceMotion
    ? undefined
    : {
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      };

  const backFaceStyle: CSSProperties = reduceMotion
    ? {
        display: flipped ? "flex" : "none",
        flexDirection: "column",
      }
    : {
        ...faceBase,
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        transform: "rotateY(180deg)",
        overflowY: "auto",
      };

  const frontFaceStyle: CSSProperties = reduceMotion
    ? {
        display: flipped ? "none" : "block",
      }
    : {
        ...faceBase,
      };

  return (
    <div className={["w-full min-w-0", className].filter(Boolean).join(" ")}>
      <div style={sceneStyle} className="w-full min-w-0">
        <div
          id={panelId}
          className="relative w-full min-w-0"
          style={cardStyle}
          data-flipped={flipped ? "true" : "false"}
        >
          <div style={frontFaceStyle} className="relative w-full min-w-0">
            <ProfileKinetikFlipEarProvider value={frontEar}>
              {front}
            </ProfileKinetikFlipEarProvider>
          </div>
          <div style={backFaceStyle} className="relative w-full min-w-0">
            <ProfileKinetikFlipEarProvider value={backEar}>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">{back}</div>
            </ProfileKinetikFlipEarProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
