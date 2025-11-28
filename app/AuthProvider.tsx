"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SplashWrapper from "./SplashWrapper";

type AuthContextType = {
  status: "loading" | "guest" | "ready";
  fUser: any;
  handle: string | null;
};

const AuthContext = createContext<AuthContextType>({
  status: "loading",
  fUser: null,
  handle: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, fUser } = useFirebaseUser();

  const [handle, setHandle] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // 初回訪問判定
  useEffect(() => {
    const v = localStorage.getItem("hasVisited");
    if (v === "yes") setIsFirstVisit(false);
    localStorage.setItem("hasVisited", "yes");
  }, []);

  // handle ロード（ログイン時）
  useEffect(() => {
    if (!fUser) {
      setHandle(null);
      return;
    }

    const load = async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      const h = snap.data()?.handle || snap.data()?.slug || null;
      setHandle(h);
    };
    load();
  }, [fUser]);

  // ★ 初回だけスプラッシュ、それ以降は絶対に出さない
  if (status === "loading" && isFirstVisit) {
    return <SplashWrapper forceSplash />;
  }

  // ★ ログイン済みだが handle 未ロード → 初回だけ Splash、2回目以降は children
  if (status === "ready" && !handle && isFirstVisit) {
    return <SplashWrapper forceSplash />;
  }

  return (
    <AuthContext.Provider value={{ status, fUser, handle }}>
      {children}
    </AuthContext.Provider>
  );
}
