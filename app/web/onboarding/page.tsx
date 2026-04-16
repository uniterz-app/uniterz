"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import OnboardingForm from "@/app/component/auth/OnboardingForm";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import { normalizeLanguage } from "@/lib/i18n/language";

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

      const data = (await getUserDocDataCached(fUser.uid)) as any;

      const hasHandle = Boolean(data?.handle || data?.slug);
      const hasLanguage = normalizeLanguage(data?.language) !== null;

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
