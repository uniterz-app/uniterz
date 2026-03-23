"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";

export default function Page() {
  const router = useRouter();
  const { status, handle } = useAuth();
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWaiting(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (waiting) return;
    if (status === "loading") return;

    const isMobile = window.innerWidth < 768;

    if (status === "ready" && handle) {
      router.replace(isMobile ? `/mobile/u/${handle}` : `/web/u/${handle}`);
      return;
    }

    router.replace(isMobile ? "/mobile/games" : "/web/games");
  }, [waiting, status, handle, router]);

  return null;
}