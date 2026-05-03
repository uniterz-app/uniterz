import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import type { AuthStatus } from "../shared/authState";

type FirebaseUserContextValue = {
  fUser: User | null;
  status: AuthStatus;
};

const FirebaseUserContext = createContext<FirebaseUserContextValue | null>(null);

export function FirebaseUserProvider({ children }: { children: ReactNode }) {
  const [fUser, setFUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFUser(user);
      setStatus(user ? "ready" : "guest");
    });
    return () => unsub();
  }, []);

  const value = useMemo(() => ({ fUser, status }), [fUser, status]);
  return (
    <FirebaseUserContext.Provider value={value}>
      {children}
    </FirebaseUserContext.Provider>
  );
}

export function useFirebaseUser() {
  const ctx = useContext(FirebaseUserContext);
  if (!ctx) {
    throw new Error("useFirebaseUser は FirebaseUserProvider 内で使用してください。");
  }
  return ctx;
}
