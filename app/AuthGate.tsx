"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, fUser } = useFirebaseUser();
  const pathname = usePathname();
  const router = useRouter();

  const [handle, setHandle] = useState<string | null>(null);

  const isAuthPage =
    pathname === "/mobile/login" || pathname === "/mobile/signup";

  const isDesktop =
    typeof window !== "undefined" && window.innerWidth >= 768;

  /* ---- handle 読み込み ---- */
  useEffect(() => {
    if (!fUser) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      const h = snap.data()?.handle || snap.data()?.slug || null;
      setHandle(h);
    };

    load();
  }, [fUser]);

  return <>{children}</>;
}
