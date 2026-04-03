"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/app/component/NavBar";
import Header from "@/app/component/Header";

export default function AppChrome() {
  const pathname = usePathname() ?? "";

  const shouldHideAll =
    pathname === "/" ||
    pathname === "/lp" ||
    pathname === "/web" ||
    pathname === "/mobile" ||
    pathname === "/web/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/login" ||
    pathname === "/mobile/signup";

  const shouldHideHeader =
    pathname === "/web/rankings" ||
    pathname === "/mobile/rankings" ||
    pathname.startsWith("/web/communities/") ||
    pathname.startsWith("/mobile/communities/");

  const shouldHideNavBar = false;

  if (shouldHideAll) return null;

  return (
    <>
      {!shouldHideHeader && <Header />}
      {!shouldHideNavBar && <NavBar />}
    </>
  );
}