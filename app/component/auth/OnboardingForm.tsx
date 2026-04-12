"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Camera } from "lucide-react";
import { FaUser } from "react-icons/fa";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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

type Props = {
  variant?: "web" | "mobile";
};

type Language = "ja" | "en";

const TIMEZONE_BY_LANGUAGE: Record<Language, string> = {
  ja: "Asia/Tokyo",
  en: "America/New_York",
};

export default function OnboardingForm({ variant }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const osIsJa =
    typeof navigator !== "undefined" &&
    navigator.language?.toLowerCase().startsWith("ja");

  const resolvedVariant: "web" | "mobile" = useMemo(() => {
    if (variant) return variant;
    return pathname?.startsWith("/mobile") ? "mobile" : "web";
  }, [variant, pathname]);

  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState<Language>(() =>
    osIsJa ? "ja" : "en"
  );
  const [countryCode, setCountryCode] = useState("");
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

  const ui = {
    subtitle: osIsJa
      ? "ユーザーネームと言語を設定すると次へ進めます（必須）"
      : "Set your username and language to continue (required)",
    usernameLabel: osIsJa
      ? "ユーザーネーム（必須）"
      : "Username (required)",
    usernamePlaceholder: osIsJa ? "Username" : "Username",
    languageLabel: osIsJa ? "使用言語（必須）" : "App Language (required)",
    countryLabel: osIsJa ? "住んでいる国（任意）" : "Country (optional)",
    countryNote: osIsJa
      ? "国はランキング表示時のフラッグに使用されます。"
      : "Country is used for the flag shown on rankings.",
    countryNoteLater: osIsJa
      ? "（一部の国は今後フラッグ画像を追加予定）"
      : "(Some flags may be added later.)",
    selectCountryPlaceholder: osIsJa ? "未設定" : "Not set",
  } as const;

  const canSubmit = displayName.trim().length > 0;
  const formWidth = resolvedVariant === "mobile" ? 320 : 380;
  const selectedCountryHasFlag = countryCode ? Boolean(FLAG_SRC[countryCode]) : false;

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

      const slug = await ensureUserSlug(db, user.uid);
      const uploadedPhotoURL = await uploadAvatarIfNeeded(user.uid);

      await setDoc(
        userRef,
        {
          displayName: displayName.trim(),
          username: slug,
          handle: slug,
          slug,
          language,
          locale: language,
          timeZone: TIMEZONE_BY_LANGUAGE[language],
          countryCode: countryCode || null,
          photoURL:
            uploadedPhotoURL ??
            (typeof existing.photoURL === "string" ? existing.photoURL : ""),
          onboardingCompletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const profileBase = resolvedVariant === "mobile" ? "/mobile/u" : "/web/u";
      router.replace(`${profileBase}/${encodeURIComponent(slug)}`);
    } catch (err) {
      console.error("onboarding save failed:", err);
      alert(
        language === "en"
          ? "Failed to save. Please try again later."
          : "保存に失敗しました。時間をおいて再度お試しください。"
      );
    } finally {
      setSaving(false);
    }
  };

  const primaryCtaClass =
    language === "en"
      ? authDisplayButton
      : "font-[family-name:var(--font-geist-sans)] text-base font-bold tracking-wide text-[#e6e4de]";

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="relative isolate mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/55 px-6 pb-7 pt-4 text-center shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:pt-5"
        style={{ width: formWidth, maxWidth: "100%" }}
      >
        <div className={cyberFieldStyles.pageGrid} aria-hidden />
        <div className="relative z-10">
          <AuthFormBranding />
          <h1 className={`mt-1 ${authDisplayHeadingLong}`}>PROFILE SETUP</h1>
          <p className={`mt-2 ${bodySans}`}>{ui.subtitle}</p>

          <div className="mt-4 flex justify-center">
            <label className="relative cursor-pointer">
              <div
                className="relative h-[92px] w-[92px] overflow-hidden rounded-full border border-white/10 bg-black/40 ring-1 ring-white/5"
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
          </div>

          <div className="mt-5 space-y-3 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/75">
                {ui.usernameLabel}
              </label>
              <CyberAuthField
                inputProps={{
                  type: "text",
                  name: "username",
                  autoComplete: "username",
                  placeholder: ui.usernamePlaceholder,
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/75">
                {ui.languageLabel}
              </label>
              <CyberAuthSelect
                selectProps={{
                  value: language,
                  onChange: (e) => setLanguage(e.target.value as Language),
                }}
              >
                <option value="ja">{osIsJa ? "日本語" : "Japanese"}</option>
                <option value="en">English</option>
              </CyberAuthSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/75">
                {ui.countryLabel}
              </label>
              <CyberAuthSelect
                selectProps={{
                  value: countryCode,
                  onChange: (e) => setCountryCode(e.target.value),
                }}
              >
                <option value="">{ui.selectCountryPlaceholder}</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {language === "en" ? c.labelEn : c.labelJa}
                  </option>
                ))}
              </CyberAuthSelect>
              <p className="mt-1 font-[family-name:var(--font-geist-sans)] text-xs leading-relaxed text-white/60">
                {ui.countryNote}
                {countryCode && !selectedCountryHasFlag
                  ? ui.countryNoteLater
                  : ""}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || saving}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            className={[
              "mt-5 flex w-full items-center justify-center rounded-[14px] border-0 px-3.5 py-3",
              primaryCtaClass,
              "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-violet-600",
              "shadow-[0_10px_30px_rgba(6,182,212,0.25),0_12px_34px_rgba(124,58,237,0.22)]",
              "transition-[transform,filter,opacity] duration-100 ease-out",
              pressed ? "scale-[0.97]" : "scale-100",
              !canSubmit || saving ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
          >
            {saving
              ? language === "en"
                ? "SAVING..."
                : "保存中..."
              : language === "en"
                ? "CONTINUE"
                : "次へ"}
          </button>
        </div>
      </div>
    </form>
  );
}
