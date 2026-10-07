import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/** 本番では 404。モックだけで動く `*-preview` ルート用 */
export default function DevOnlyLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <>{children}</>;
}
