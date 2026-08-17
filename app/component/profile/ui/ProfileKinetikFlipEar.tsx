"use client";

/**
 * プロフィール ↔ CAREER フリップ用の耳タブ（Web）。
 * FlipShell が Provider、カード枠側が描画して「枠の一部」にする。
 */
import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { nameRajdhani } from "@/lib/fonts";

export const KINETIK_FLIP_EAR = {
  widthPx: 96,
  heightPx: 22,
  rightPx: 12,
  /** height - 1 — 天辺ラインが耳下端で接合（途中横断で線が飛び出すのを防ぐ） */
  lipPx: 21,
} as const;

export type ProfileKinetikFlipEarValue = {
  label: string;
  onToggle: () => void;
  pressed: boolean;
  panelId: string;
};

const ProfileKinetikFlipEarContext =
  createContext<ProfileKinetikFlipEarValue | null>(null);

export function ProfileKinetikFlipEarProvider({
  value,
  children,
}: {
  value: ProfileKinetikFlipEarValue;
  children: ReactNode;
}) {
  return (
    <ProfileKinetikFlipEarContext.Provider value={value}>
      {children}
    </ProfileKinetikFlipEarContext.Provider>
  );
}

export function useProfileKinetikFlipEar(): ProfileKinetikFlipEarValue | null {
  return useContext(ProfileKinetikFlipEarContext);
}

/** 塗りなし・枠線のみ。カード天辺の切れ込みとして乗せる */
export function ProfileKinetikFlipEar({
  borderClassName = "border-[#00F5FF]/70",
}: {
  borderClassName?: string;
}) {
  const ear = useProfileKinetikFlipEar();
  if (!ear) return null;

  return (
    <button
      type="button"
      onClick={ear.onToggle}
      aria-pressed={ear.pressed}
      aria-controls={ear.panelId}
      /** 表（CAREER）だけチュートリアル穴の対象。裏の PROFILE 耳は測らない */
      data-tutorial-target={ear.pressed ? undefined : "profile-career-tab"}
      className={[
        nameRajdhani.className,
        "absolute z-[8] flex items-center justify-center",
        "border border-b-0 bg-transparent px-2.5",
        "text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00F5FF]",
        "transition-[border-color,color,opacity] duration-200",
        "hover:border-[#00F5FF]/85 hover:text-[#7DFAFF] active:opacity-85",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F5FF]/70",
        borderClassName,
      ].join(" ")}
      style={{
        top: 0,
        right: KINETIK_FLIP_EAR.rightPx,
        width: KINETIK_FLIP_EAR.widthPx,
        height: KINETIK_FLIP_EAR.heightPx,
      }}
    >
      <span className="relative">{ear.label}</span>
    </button>
  );
}

/** 天辺ボーダーの左右セグメント（耳幅を空ける） */
export function ProfileKinetikFlipEarTopEdges({
  borderClassName = "bg-[#00F5FF]/70",
}: {
  borderClassName?: string;
}) {
  const ear = useProfileKinetikFlipEar();
  if (!ear) return null;

  const gap = KINETIK_FLIP_EAR.rightPx + KINETIK_FLIP_EAR.widthPx;

  return (
    <>
      <span
        aria-hidden
        className={[
          "profile-kinetik-flip-ear-edge pointer-events-none absolute left-0 top-0 z-[6] h-px",
          borderClassName,
        ].join(" ")}
        style={{ right: gap }}
      />
      <span
        aria-hidden
        className={[
          "profile-kinetik-flip-ear-edge pointer-events-none absolute right-0 top-0 z-[6] h-px",
          borderClassName,
        ].join(" ")}
        style={{ width: KINETIK_FLIP_EAR.rightPx }}
      />
    </>
  );
}
