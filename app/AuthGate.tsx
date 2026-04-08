"use client";

import { useEffect } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { usePathname, useRouter } from "next/navigation";

function gateSplash() {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center splash-screen-bg">
      <div className="mt-27 ml-4 animate-pulse text-sm text-white/80">
        Loading...
      </div>
    </div>
  );
}

function isWebPublicPath(pathname: string | null): boolean {
  if (!pathname?.startsWith("/web")) return false;
  if (pathname === "/web/login" || pathname === "/web/signup") return true;
  if (pathname.startsWith("/web/reset")) return true;
  return false;
}

function isMobilePublicPath(pathname: string | null): boolean {
  if (!pathname?.startsWith("/mobile")) return false;
  if (pathname === "/mobile/login" || pathname === "/mobile/signup") return true;
  if (pathname.startsWith("/mobile/reset")) return true;
  return false;
}

type AuthGateProps = {
  children: React.ReactNode;
  platform: "web" | "mobile";
};

/**
 * /web/* /mobile/* のうち、ログイン不要なのは login / signup / reset のみ。
 * 未ログインは各プラットフォームの LP へ送る。
 */
export default function AuthGate({ children, platform }: AuthGateProps) {
  const { status } = useFirebaseUser();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic =
    platform === "web"
      ? isWebPublicPath(pathname)
      : isMobilePublicPath(pathname);

  const lpHref = platform === "web" ? "/lp" : "/mobile/lp";

  const mustBlockForGuest = status === "guest" && !isPublic;
  const blocking = status === "loading" || mustBlockForGuest;

  useEffect(() => {
    if (status !== "guest" || isPublic) return;
    router.replace(lpHref);
  }, [status, isPublic, lpHref, router]);

  if (blocking) {
    return gateSplash();
  }

  return <>{children}</>;
}
