import type { CyberMenuButtonSize } from "./cyberMenuButton";
import { cyberFilterBarClasses } from "./cyberFilterBar";

/** globals.css `.games-header-control-h` — バーガー・絞り込み共通の固定高さ */
export const GAMES_HEADER_CONTROL_H = "games-header-control-h";
export const GAMES_HEADER_CONTROL_H_LG = "games-header-control-h games-header-control-h--lg";

/** 試合一覧ヘッダー：バーガーと絞り込みの高さ */
export function gamesHeaderControlHeightClass(isMobile: boolean): string {
  return isMobile ? GAMES_HEADER_CONTROL_H : GAMES_HEADER_CONTROL_H_LG;
}

/** ヘッダー内ボタン共通（border 込みで高さ固定） */
export function gamesHeaderControlButtonClass(isMobile: boolean): string {
  return [
    "box-border flex shrink-0 items-center justify-center overflow-hidden",
    gamesHeaderControlHeightClass(isMobile),
  ].join(" ");
}

/** ヘッダー絞り込みトリガー（バーガーと同じ px 高さ・見た目） */
export function gamesHeaderFilterTriggerClass(isMobile: boolean): string {
  return [
    gamesHeaderControlButtonClass(isMobile),
    "relative z-20 m-0 flex-nowrap gap-1.5 px-2.5 py-0 font-bold uppercase tracking-wide leading-none whitespace-nowrap touch-manipulation cursor-pointer",
    isMobile ? "text-[10px]" : "text-xs md:text-sm",
  ].join(" ");
}

/** 試合ヘッダー絞り込みボタンの class 一式 */
export function gamesHeaderFilterButtonClasses(
  active: boolean,
  isMobile: boolean,
  extra = ""
): string {
  return cyberFilterBarClasses(
    active,
    [gamesHeaderFilterTriggerClass(isMobile), extra].filter(Boolean).join(" "),
    true
  );
}

export function gamesHeaderMenuButtonSize(isMobile: boolean): CyberMenuButtonSize {
  return isMobile ? "md" : "lg";
}

/** ヘッダー外枠 */
export function gamesHeaderShellClass(isMobile: boolean): string {
  return isMobile
    ? "mb-3 mt-2 flex w-full flex-col"
    : "relative mb-3 mt-2 flex flex-col gap-2 pl-2 pr-1 sm:pl-3";
}

/** モバイル：左右ボタン＋タイトル＋日付行 */
export function gamesHeaderMobileShellClass(): string {
  return "relative flex w-full flex-col gap-1";
}

/** モバイル：タイトル行（左右ボタンは absolute） */
export function gamesHeaderMobileTitleRowClass(): string {
  return `relative w-full ${GAMES_HEADER_CONTROL_H}`;
}

/** リーグ名：画面水平中央 */
export function gamesHeaderTitleCenterClass(isMobile: boolean): string {
  return [
    "pointer-events-none absolute left-1/2 top-1/2 z-10",
    isMobile
      ? "w-max max-w-[calc(100vw-11rem)]"
      : "w-max max-w-[calc(100%-11rem)]",
    "-translate-x-1/2 -translate-y-1/2",
    "text-center leading-none",
  ].join(" ");
}

export function gamesHeaderMobileSideLeftClass(): string {
  return [
    "absolute left-2 top-0 z-20 flex items-start",
    GAMES_HEADER_CONTROL_H,
  ].join(" ");
}

export function gamesHeaderMobileSideRightClass(): string {
  return [
    "absolute right-2 top-0 z-20 flex items-start justify-end gap-1.5",
    GAMES_HEADER_CONTROL_H,
  ].join(" ");
}

/** 中央：リーグ名＋月表示（デスクトップ） */
export function gamesHeaderTitleStackClass(isMobile: boolean): string {
  return isMobile
    ? ""
    : "flex w-full flex-col items-center gap-2.5 text-center";
}

export function gamesHeaderCornerLeftClass(): string {
  return "absolute left-2 top-0 z-20";
}

export function gamesHeaderCornerRightClass(): string {
  return "absolute right-1 top-0 z-20 flex items-start justify-end gap-1.5";
}

/** ヘッダー行（デスクトップ：左右 absolute ＋中央タイトル） */
export function gamesHeaderRowClass(isMobile: boolean): string {
  if (isMobile) {
    return "";
  }
  return `relative w-full ${GAMES_HEADER_CONTROL_H_LG}`;
}

export function gamesHeaderDesktopSideLeftClass(): string {
  return [
    "absolute left-2 top-0 z-20 flex items-start",
    GAMES_HEADER_CONTROL_H_LG,
  ].join(" ");
}

export function gamesHeaderDesktopSideRightClass(): string {
  return [
    "absolute right-2 top-0 z-20 flex items-start justify-end gap-1.5",
    GAMES_HEADER_CONTROL_H_LG,
  ].join(" ");
}

/** 左：バーガー用スロット */
export function gamesHeaderMenuSlotClass(isMobile: boolean): string {
  return [
    "flex shrink-0 items-start justify-center",
    gamesHeaderControlHeightClass(isMobile),
    isMobile ? "w-9" : "w-10",
  ].join(" ");
}

/** 右：絞り込み・Bracket 用スロット */
export function gamesHeaderActionsSlotClass(isMobile: boolean): string {
  return [
    "relative z-20 flex shrink-0 items-start justify-end gap-1.5 self-start pointer-events-auto",
    gamesHeaderControlHeightClass(isMobile),
  ].join(" ");
}

/** 絞り込み用 motion ラッパー（上寄せ・クリック領域はボタン幅のみ） */
export function gamesHeaderFilterWrapClass(isMobile = true): string {
  return [
    "relative z-20 flex w-fit shrink-0 items-start self-start pointer-events-auto touch-manipulation -translate-y-px",
    gamesHeaderControlHeightClass(isMobile),
  ].join(" ");
}

/** バーガー／絞り込みの motion ラッパー */
export function gamesHeaderControlWrapClass(isMobile = true): string {
  return [
    "flex items-stretch self-stretch",
    gamesHeaderControlHeightClass(isMobile),
  ].join(" ");
}
