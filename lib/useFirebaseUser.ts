// /lib/useFirebaseUser.ts
"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Status = "loading" | "guest" | "ready";

export function useFirebaseUser() {
  const [status, setStatus] = useState<Status>("loading");
  const [fUser, setFUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFUser(u);                 // u or null
      setStatus(u ? "ready" : "guest"); // ← これが必要
    });
    return () => unsub();
  }, []);

  return { fUser, status } as const;
}
