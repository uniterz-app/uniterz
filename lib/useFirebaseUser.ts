"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type FirebaseAuthStatus = "loading" | "guest" | "ready";

type FirebaseUserContextValue = { fUser: User | null; status: FirebaseAuthStatus };

const FirebaseUserContext = createContext<FirebaseUserContextValue | null>(null);

/**
 * onAuthStateChanged が一度確定した値を保持。React StrictMode の再マウントで
 * status が loading に戻りスプラッシュが二重になるのを防ぐ。
 */
let authListenerResolved = false;
let snapshotUser: User | null = null;

function readInitialAuth(): FirebaseUserContextValue {
  if (authListenerResolved) {
    return {
      fUser: snapshotUser,
      status: snapshotUser ? "ready" : "guest",
    };
  }
  const u = auth.currentUser;
  if (u) {
    return { fUser: u, status: "ready" };
  }
  return { fUser: null, status: "loading" };
}

export function FirebaseUserProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => readInitialAuth(), []);
  const [status, setStatus] = useState<FirebaseAuthStatus>(initial.status);
  const [fUser, setFUser] = useState<User | null>(initial.fUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      authListenerResolved = true;
      snapshotUser = u;
      setFUser(u);
      setStatus(u ? "ready" : "guest");
    });
    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({ fUser, status }),
    [fUser, status]
  );

  return React.createElement(
    FirebaseUserContext.Provider,
    { value },
    children
  );
}

export function useFirebaseUser(): FirebaseUserContextValue {
  const ctx = useContext(FirebaseUserContext);
  if (!ctx) {
    throw new Error("useFirebaseUser must be used within FirebaseUserProvider");
  }
  return ctx;
}
