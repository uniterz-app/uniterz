"use client";

import { usePathname } from "next/navigation";

type AppContentShellProps = {
  children: React.ReactNode;
};

/**
 * Web のみ perspective を付与。モバイルでは 3D 合成コンテキストを避ける。
 */
export default function AppContentShell({ children }: AppContentShellProps) {
  const pathname = usePathname();
  const isMobileRoute =
    pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");

  return (
    <div
      style={{
        perspective: isMobileRoute ? undefined : "1400px",
        width: "100%",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
