"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

function EntrySplash() {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center splash-screen-bg">
      <div className="mt-27 ml-4 animate-pulse text-sm text-white/80">
        Loading...
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const { status, fUser } = useFirebaseUser();
  const [showIntroSplash, setShowIntroSplash] = useState(true);
  const [handle, setHandle] = useState<string | null>(null);
  const [handleResolved, setHandleResolved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowIntroSplash(false), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!fUser) {
      setHandle(null);
      setHandleResolved(true);
      return;
    }
    setHandleResolved(false);
    let cancelled = false;
    (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (cancelled) return;
      const h = snap.data()?.handle || snap.data()?.slug || null;
      setHandle(h);
      setHandleResolved(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [fUser]);

  useEffect(() => {
    if (showIntroSplash) return;
    if (status === "loading") return;
    if (status === "ready" && fUser && !handleResolved) return;

    const isMobile = window.innerWidth < 768;

    if (status === "ready" && fUser && handle) {
      router.replace(isMobile ? `/mobile/u/${handle}` : `/web/u/${handle}`);
      return;
    }

    if (status === "guest") {
      router.replace(isMobile ? "/mobile/lp" : "/lp");
      return;
    }

    router.replace(isMobile ? "/mobile/games" : "/web/games");
  }, [
    showIntroSplash,
    status,
    fUser,
    handle,
    handleResolved,
    router,
  ]);

  if (showIntroSplash) {
    return <EntrySplash />;
  }

  if (status === "loading" || (status === "ready" && fUser && !handleResolved)) {
    return <EntrySplash />;
  }

  return null;
}
