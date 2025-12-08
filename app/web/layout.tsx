"use client";

import { PrefixContext } from "@/app/PrefixContext";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrefixContext.Provider value="/web">
      {children}
    </PrefixContext.Provider>
  );
}
