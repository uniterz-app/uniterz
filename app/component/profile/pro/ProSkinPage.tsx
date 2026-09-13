"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import ProfilePlanProSkinPicker from "@/app/component/profile/pro/ProfilePlanProSkinPicker";
import { isAuthStateResolved, useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { parseUserPlanProBgVariant } from "@/lib/profile/profilePlanProBgVariantField";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

type Props = {
  platform: "mobile" | "web";
};

export default function ProSkinPage({ platform }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTrial = searchParams.get("from") === "trial";
  const { fUser, status } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
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

  const isWeb = platform === "web";

  return (
    <ProfileCyberPage
      title="SKIN"
      subtitle={L(resolveLocalizedLang(language), {
        ja: "Pro プロフィール背景スキンを選べます。",
        en: "Choose a Pro profile background skin.",
        ko: "Pro 프로필 배경 스킨을 선택할 수 있습니다.",
        zh: "可选择 Pro 个人资料背景皮肤。",
        es: "Elige un skin de fondo Pro para el perfil.",
        pt: "Escolha uma skin de fundo Pro para o perfil.",
        fr: "Choisissez un skin de fond Pro pour le profil.",
      })}
      edgeBack={fromTrial ? false : undefined}
      hideBack={fromTrial ? true : undefined}
      contentClassName={
        isWeb
          ? "max-w-6xl px-4 py-2 md:px-6 md:py-4"
          : "max-w-lg px-0 py-0 sm:px-0"
      }
    >
      <ProfilePlanProSkinPicker
        mode="production"
        platform={platform}
        initialSelectedId={initialSelectedId}
      />
    </ProfileCyberPage>
  );
}
