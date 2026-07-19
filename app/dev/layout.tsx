import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/** /dev/* は開発用プレビュー。個別ページ側の変更なしで一括ガードする */
export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <>{children}</>;
}
