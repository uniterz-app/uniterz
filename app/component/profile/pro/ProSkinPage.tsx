"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";
import ProfilePlanProSkinPicker from "@/app/component/profile/pro/ProfilePlanProSkinPicker";
import { isAuthStateResolved, useFirebaseUser } from "@/lib/useFirebaseUser";
import { parseUserPlanProBgVariant } from "@/lib/profile/profilePlanProBgVariantField";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

type Props = {
  platform: "mobile" | "web";
};

export default function ProSkinPage({ platform }: Props) {
  const router = useRouter();
  const { fUser, status } = useFirebaseUser();
  const [ready, setReady] = useState(false);
  const [initialSelectedId, setInitialSelectedId] =
    useState<ProfilePlanProBgVariant | null>(null);

  useEffect(() => {
    if (!isAuthStateResolved(status)) return;
    if (!fUser) {
      router.replace(platform === "web" ? "/web/login" : "/mobile/login");
      return;
    }

    let alive = true;
    getUserDocDataCached(fUser.uid).then((data) => {
      if (!alive) return;
      setInitialSelectedId(parseUserPlanProBgVariant(data?.planProBgVariant));
      setReady(true);
    });

    return () => {
      alive = false;
    };
  }, [fUser, status, router, platform]);

  if (!ready) {
    return <div className="min-h-screen bg-[#03080d]" />;
  }

  return (
    <>
      <FloatingCloseButton />
      <ProfilePlanProSkinPicker
        mode="production"
        initialSelectedId={initialSelectedId}
      />
    </>
  );
}
