"use client";

import { PrefixProvider } from "@/app/PrefixContext";
import { FirebaseUserProvider } from "@/lib/useFirebaseUser";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseUserProvider>
      <PrefixProvider>{children}</PrefixProvider>
    </FirebaseUserProvider>
  );
}
