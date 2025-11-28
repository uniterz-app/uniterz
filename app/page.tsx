// app/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/firebase";

// ※注意：app/page.tsx は「サーバーコンポーネント」
//       → Firebase Auth は使えないので cookie で判定する

export default async function Page() {
  // ---- UA 読み取り（Next.js 15 は await 必須） ----
  const h = await headers();
  const ua = h.get("user-agent") || "";
  const isMobile = /iPhone|Android/i.test(ua);

  // ---- Firebase Auth のログイン状態は cookie に保存されている ----
  //      → "firebase:authUser" という cookie の存在で判定できる
  const cookieHeader = h.get("cookie") || "";
  const isLoggedIn = cookieHeader.includes("firebase:authUser");

  // ---- PC（web）はこれだけでOK ----
  if (!isMobile) {
    if (isLoggedIn) {
      redirect("/web/mypage");
    } else {
      redirect("/web/login");
    }
  }

  // ---- Mobile の場合 ----
  if (isLoggedIn) {
    redirect("/mobile/mypage"); // ← ログイン済みはマイページへ
  } else {
    redirect("/mobile/signup"); // ← 初回 or 未ログイン
  }
}
