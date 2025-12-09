"use client";

import Mobile from "./Mobile";
import Web from "./Web";
import { useIsMobile } from "@/hooks/useIsMobile";

type PredictionPostCardV2Props = {
  post: any;
  mode?: "list" | "detail";
  profileHref?: string;
};

export default function PredictionPostCardV2(props: PredictionPostCardV2Props) {
  const isMobile = useIsMobile();

  if (isMobile) return <Mobile {...props} />;
  return <Web {...props} />;
}
