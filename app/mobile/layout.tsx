"use client";

import { PrefixContext } from "@/app/PrefixContext";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrefixContext.Provider value="/mobile">
      {children}
    </PrefixContext.Provider>
  );
}
