"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

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

  useEffect(() => {
    if (!fUser) {
      setHandle(null);
      return;
    }

    const load = async () => {
      const data = await getUserDocDataCached(fUser.uid);
      const h = data?.handle || data?.slug || null;
      setHandle(h);
    };

    load();
  }, [fUser]);

  return (
    <AuthContext.Provider value={{ status, fUser, handle }}>
      {children}
    </AuthContext.Provider>
  );
}