"use client";

import { type ReactNode } from "react";
import MatchListLineFrame from "@/app/component/games/MatchListLineFrame";
import { PROFILE_OVERVIEW_LINE_FRAME_PAINT } from "@/lib/games/matchListLineFrame";

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

/**
 * 左寄せラウンドラベル + 白パス（プロフィール概要カード）。
 */
export default function LineFrameCard({ title, children, className }: Props) {
  return (
    <MatchListLineFrame
      topLabel={title}
      topLabelAlign="start"
      paint={PROFILE_OVERVIEW_LINE_FRAME_PAINT}
      className={className}
    >
      {children}
    </MatchListLineFrame>
  );
}
