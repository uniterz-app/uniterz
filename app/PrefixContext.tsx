"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export type AppPathPrefix = "/web" | "/mobile";

const PrefixContext = createContext<AppPathPrefix>("/web");

/** 現在のルートに応じた `/web` / `/mobile` を配下へ供給 */
export function PrefixProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const prefix = useMemo<AppPathPrefix>(() => {
    if (pathname.startsWith("/mobile") || pathname.startsWith("/m/")) {
      return "/mobile";
    }
    return "/web";
  }, [pathname]);

  return (
    <PrefixContext.Provider value={prefix}>{children}</PrefixContext.Provider>
  );
}

export function usePrefix(): AppPathPrefix {
  return useContext(PrefixContext);
}
