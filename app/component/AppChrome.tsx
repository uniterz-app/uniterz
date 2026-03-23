"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/app/component/NavBar";
import Header from "@/app/component/Header";

export default function AppChrome() {
  const pathname = usePathname() ?? "";

<<<<<<< HEAD
  const shouldHideHeader = pathname === "/lp";

  const shouldHideNav =
=======
  const shouldHideAll =
>>>>>>> origin/develop
    pathname === "/" ||
    pathname === "/lp" ||
    pathname === "/web" ||
    pathname === "/mobile" ||
    pathname === "/web/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/login" ||
    pathname === "/mobile/signup";

<<<<<<< HEAD
  return (
    <>
      {!shouldHideHeader && <Header />}
      {!shouldHideNav && <NavBar />}
=======
  const shouldHideHeader =
    pathname === "/web/rankings" ||
    pathname === "/mobile/rankings";

  const shouldHideNavBar = false;

  if (shouldHideAll) return null;

  return (
    <>
      {!shouldHideHeader && <Header />}
      {!shouldHideNavBar && <NavBar />}
>>>>>>> origin/develop
    </>
  );
}