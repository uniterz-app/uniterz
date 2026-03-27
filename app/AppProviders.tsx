"use client";

import { FirebaseUserProvider } from "@/lib/useFirebaseUser";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FirebaseUserProvider>{children}</FirebaseUserProvider>;
}
