"use client";

import type { HTMLAttributes, ReactNode } from "react";

/**
 * Compose の SharedTransitionLayout に相当するラッパー。
 * 共有要素（view-transition-name）を含むツリーのスタッキング文脈を切る。
 *
 * @see https://developer.android.com/develop/ui/compose/animation/shared-elements?hl=ja
 */
export default function ScheduleSharedTransitionLayout({
  children,
  ...rest
}: {
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="relative isolate min-h-0 w-full min-w-0"
      data-schedule-shared-transition-layout
      {...rest}
    >
      {children}
    </div>
  );
}
