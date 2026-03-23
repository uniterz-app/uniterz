"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/app/component/NavBar";
import Header from "@/app/component/Header";

export default function AppChrome() {
  const pathname = usePathname() ?? "";

  const shouldHideHeader = pathname === "/lp";

  const shouldHideNav =
    pathname === "/" ||
    pathname === "/lp" ||
    pathname === "/web" ||
    pathname === "/mobile" ||
    pathname === "/web/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/login" ||
    pathname === "/mobile/signup";

  return (
    <>
      {!shouldHideHeader && <Header />}
      {!shouldHideNav && <NavBar />}
    </>
  );
}