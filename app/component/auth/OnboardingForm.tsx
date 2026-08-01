"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Camera } from "lucide-react";
import { FaUser } from "react-icons/fa";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/lib/firebase";
import { ensureUserSlug } from "@/lib/ensureSlug";
import { COUNTRY_OPTIONS, FLAG_SRC } from "@/lib/rankings/country";
import CyberAuthField from "./CyberAuthField";
import CyberAuthSelect from "./CyberAuthSelect";
import AuthFormBranding from "./AuthFormBranding";
import cyberFieldStyles from "./cyberAuthField.module.css";
import {
  authDisplayHeadingLong,
  authDisplayButton,
} from "./authEnglishDisplay";
import type { Language } from "@/lib/i18n/language";
import { ALL_LANGUAGES, LANGUAGE_NATIVE_NAMES, guessLanguageFromNavigator } from "@/lib/i18n/language";
import { ui as uiStr } from "@/lib/i18n/ui";
import { saveMeProfile } from "@/lib/api/saveMeProfile";
import { consumePostOnboardingRedirect } from "@/lib/auth/safeNextRedirect";
import { LEAGUES } from "@/lib/leagues";
import type { PreferredLeague } from "@/lib/user/preferredLeague";
import {
  isProfileGamblingTermsError,
  profileGamblingTermsUserMessage,
} from "@/lib/profile/profileGamblingTerms";

type Props = {
  variant?: "web" | "mobile";
};

export default function OnboardingForm({ variant }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const resolvedVariant: "web" | "mobile" = useMemo(() => {
    if (variant) return variant;
    return pathname?.startsWith("/mobile") ? "mobile" : "web";
  }, [variant, pathname]);

  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState<Language>(() =>
    guessLanguageFromNavigator()
  );
  const [countryCode, setCountryCode] = useState("");
  const [preferredLeague, setPreferredLeague] = useState<PreferredLeague | null>(
    null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [pressed, setPressed] = useState(false);

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) return null;
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const bodySans =
    "font-[family-name:var(--font-geist-sans)] text-sm leading-relaxed text-white/85";

  const canSubmit =
    displayName.trim().length > 0 && preferredLeague !== null;
  const isWeb = resolvedVariant === "web";
  const selectedCountryHasFlag = countryCode ? Boolean(FLAG_SRC[countryCode]) : false;

  const primaryCtaClass =
    language === "en"
      ? authDisplayButton
      : "font-[family-name:var(--font-geist-sans)] text-base font-bold tracking-wide text-[#e6e4de]";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
  };

  const uploadAvatarIfNeeded = async (uid: string): Promise<string | null> => {
    if (!avatarFile) return null;
    const fileRef = ref(storage, `avatars/${uid}/onboarding_profile.jpg`);
    await uploadBytes(fileRef, avatarFile);
    return getDownloadURL(fileRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !canSubmit) return;

    try {
      setSaving(true);

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const existing = snap.exists() ? (snap.data() as Record<string, unknown>) : {};

      await ensureUserSlug(db, user.uid);
      const uploadedPhotoURL = await uploadAvatarIfNeeded(user.uid);

      await saveMeProfile({
        displayName: displayName.trim(),
        bio: typeof existing.bio === "string" ? existing.bio : "",
        photoURL:
          uploadedPhotoURL ??
          (typeof existing.photoURL === "string" ? existing.photoURL : ""),
        language,
        countryCode: countryCode || null,
        completeOnboarding: true,
        preferredLeague: preferredLeague ?? undefined,
      });

      const gamesPath = resolvedVariant === "mobile" ? "/mobile/games" : "/web/games";
      const afterOnboarding = consumePostOnboardingRedirect();
      router.replace(afterOnboarding ?? gamesPath);
    } catch (err) {
      console.error("onboarding save failed:", err);
      if (isProfileGamblingTermsError(err)) {
        alert(profileGamblingTermsUserMessage(language));
        return;
      }
      alert(
        uiStr(language, {
          ja: "保存に失敗しました。時間をおいて再度お試しください。",
          en: "Failed to save. Please try again later.",
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const leagueOptions = (
    [
      {
        id: LEAGUES.NBA as PreferredLeague,
        labelJa: "NBA",
        labelEn: "NBA",
      },
      {
        id: LEAGUES.WC as PreferredLeague,
        labelJa: "ワールドカップ",
        labelEn: "World Cup",
      },
    ] as const
  );

  const setupDesc = uiStr(language, {
    ja: "ユーザーネームと言語を設定すると次へ進めます（必須）",
    en: "Set your username and language to continue (required)",
  });

  const usernameField = (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/75">
        {uiStr(language, {
          ja: "ユーザーネーム（必須）",
          en: "Username (required)",
        })}
      </label>
      <CyberAuthField
        inputProps={{
          type: "text",
          name: "username",
          autoComplete: "username",
          placeholder: uiStr(language, {
            ja: "Username",
            en: "Username",
          }),
          value: displayName,
          onChange: (e) => setDisplayName(e.target.value),
        }}
        rightSlot={
          <span className="flex items-center justify-center text-[15px] text-white/85">
            <FaUser aria-hidden />
          </span>
        }
      />
    </div>
  );

  const languageField = (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/75">
        {uiStr(language, {
          ja: "使用言語（必須）",
          en: "App Language (required)",
        })}
      </label>
      <CyberAuthSelect
        selectProps={{
          value: language,
          onChange: (e) => setLanguage(e.target.value as Language),
        }}
      >
        {ALL_LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {LANGUAGE_NATIVE_NAMES[l]}
          </option>
        ))}
      </CyberAuthSelect>
    </div>
  );

  const leagueField = (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/75">
        {uiStr(language, {
          ja: "主に予想する大会（必須）",
          en: "Main competition (required)",
        })}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {leagueOptions.map((opt) => {
          const active = preferredLeague === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPreferredLeague(opt.id)}
              className={[
                "rounded-xl border px-2 py-2.5 text-center text-sm font-semibold transition",
                active
                  ? "border-cyan-400/55 bg-cyan-500/15 text-white shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                  : "border-white/12 bg-white/[0.04] text-white/65 hover:border-white/22 hover:text-white/85",
              ].join(" ")}
            >
              {uiStr(language, {
                ja: opt.labelJa,
                en: opt.labelEn,
              })}
            </button>
          );
        })}
      </div>
      <p className="font-[family-name:var(--font-geist-sans)] text-xs leading-relaxed text-white/55">
        {uiStr(language, {
          ja: "試合・ランキング・プロフィールの最初の表示に使います。あとから変更できます。",
          en: "Used for your initial Games, Rankings, and Profile views. You can change this later.",
        })}
      </p>
    </div>
  );

  const countryField = (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/75">
        {uiStr(language, {
          ja: "住んでいる国（任意）",
          en: "Country (optional)",
        })}
      </label>
      <CyberAuthSelect
        selectProps={{
          value: countryCode,
          onChange: (e) => setCountryCode(e.target.value),
        }}
      >
        <option value="">
          {uiStr(language, {
            ja: "未設定",
            en: "Not set",
          })}
        </option>
        {COUNTRY_OPTIONS.map((c) => (
          <option key={c.code} value={c.code}>
            {language === "ja" ? c.labelJa : c.labelEn}
          </option>
        ))}
      </CyberAuthSelect>
      <p className="mt-1 font-[family-name:var(--font-geist-sans)] text-xs leading-relaxed text-white/60">
        {uiStr(language, {
          ja: "国はランキング表示時のフラッグに使用されます。",
          en: "Country is used for the flag shown on rankings.",
        })}
        {countryCode && !selectedCountryHasFlag
          ? uiStr(language, {
              ja: "（一部の国は今後フラッグ画像を追加予定）",
              en: "(Some flags may be added later.)",
            })
          : ""}
      </p>
    </div>
  );

  const avatarPicker = (
    <label className="relative inline-block cursor-pointer">
      <div
        className={[
          "relative overflow-hidden rounded-full border border-white/10 bg-black/40 ring-1 ring-white/5",
          isWeb ? "h-[120px] w-[120px]" : "h-[92px] w-[92px]",
        ].join(" ")}
      >
        {avatarPreviewUrl ? (
          <img
            src={avatarPreviewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <span
        className="absolute -bottom-0.5 -right-1 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white/10 bg-[#0a0a0c] text-white/90 shadow-md"
        aria-hidden
      >
        <Camera className="h-[15px] w-[15px]" strokeWidth={2} />
      </span>
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />
    </label>
  );

  const submitButton = (
    <button
      type="submit"
      disabled={!canSubmit || saving}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className={[
        "flex items-center justify-center rounded-[14px] border-0 px-3.5 py-3",
        isWeb ? "ml-auto w-auto min-w-[220px] px-12" : "w-full",
        primaryCtaClass,
        "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-violet-600",
        "shadow-[0_10px_30px_rgba(6,182,212,0.25),0_12px_34px_rgba(124,58,237,0.22)]",
        "transition-[transform,filter,opacity] duration-100 ease-out",
        pressed ? "scale-[0.97]" : "scale-100",
        !canSubmit || saving ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      {saving
        ? uiStr(language, {
            ja: "保存中...",
            en: "SAVING...",
          })
        : uiStr(language, {
            ja: "次へ",
            en: "CONTINUE",
          })}
    </button>
  );

  // Web: 横長2カラム（左ブランド／右フォーム）。Mobile: 従来の縦積みカード
  if (isWeb) {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-[920px]">
        <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/55 shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className={cyberFieldStyles.pageGrid} aria-hidden />
          <div className="relative z-10 grid md:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.35fr)]">
            <aside className="flex flex-col items-center justify-center border-b border-white/10 px-8 py-10 text-center md:border-b-0 md:border-r md:px-10 md:py-12">
              <AuthFormBranding />
              <h1 className={`mt-1 ${authDisplayHeadingLong}`}>PROFILE SETUP</h1>
              <p className={`mt-3 max-w-[280px] ${bodySans}`}>{setupDesc}</p>
              <div className="mt-8">{avatarPicker}</div>
              <p className="mt-3 font-[family-name:var(--font-geist-sans)] text-xs text-white/45">
                {uiStr(language, {
                  ja: "プロフィール写真（任意）",
                  en: "Profile photo (optional)",
                })}
              </p>
            </aside>

            <div className="flex flex-col justify-center px-8 py-8 text-left md:px-10 md:py-10">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {usernameField}
                  {languageField}
                </div>
                {leagueField}
                {countryField}
              </div>
              <div className="mt-8 flex justify-end">{submitButton}</div>
            </div>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="relative isolate mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/55 px-6 pb-7 pt-4 text-center shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:pt-5"
        style={{ width: 320, maxWidth: "100%" }}
      >
        <div className={cyberFieldStyles.pageGrid} aria-hidden />
        <div className="relative z-10">
          <AuthFormBranding />
          <h1 className={`mt-1 ${authDisplayHeadingLong}`}>PROFILE SETUP</h1>
          <p className={`mt-2 ${bodySans}`}>{setupDesc}</p>

          <div className="mt-4 flex justify-center">{avatarPicker}</div>

          <div className="mt-5 space-y-3 text-left">
            {usernameField}
            {languageField}
            {leagueField}
            {countryField}
          </div>

          <div className="mt-5">{submitButton}</div>
        </div>
      </div>
    </form>
  );
}
