"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/app/component/NavBar";

export default function LayoutChrome() {
  const pathname = usePathname();

  const hideNavBar =
    pathname === "/lp" || pathname.startsWith("/lp/");

  if (hideNavBar) return null;

  return <NavBar />;
}