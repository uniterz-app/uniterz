"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import OnboardingForm from "@/app/component/auth/OnboardingForm";

export default function WebOnboardingPage() {
  const router = useRouter();
  const { status, fUser } = useFirebaseUser();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (status !== "ready") return;
      if (!fUser) {
        router.replace("/web/login");
        return;
      }

      const snap = await getDoc(doc(db, "users", fUser.uid));
      const data = snap.data() as any;

      const hasHandle = Boolean(data?.handle || data?.slug);
      const hasLanguage = data?.language === "ja" || data?.language === "en";

      if (hasHandle && hasLanguage) {
        const handle = data?.handle || data?.slug;
        router.replace(`/web/u/${encodeURIComponent(handle)}`);
        return;
      }

      if (!cancelled) setReady(true);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [status, fUser, router]);

  if (status === "loading" || !ready) return null;

  return (
    <AuthBackdrop>
      <OnboardingForm variant="web" />
    </AuthBackdrop>
  );
}
