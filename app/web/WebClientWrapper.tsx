"use client";

import React from "react";
import usePageView from "@/app/ga/usePageView";

export default function WebClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  usePageView();
  return <>{children}</>;
}
