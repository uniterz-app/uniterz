"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Camera } from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/lib/firebase";
import { ensureUserSlug } from "@/lib/ensureSlug";
import { COUNTRY_OPTIONS, FLAG_SRC } from "@/lib/rankings/country";

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
  const [language, setLanguage] = useState<Language | "">(osIsJa ? "ja" : "en");
  const [countryCode, setCountryCode] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [pressed, setPressed] = useState(false);

  const ui = {
    title: osIsJa ? "プロフィール設定" : "Set Up Profile",
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
    continueCta: osIsJa ? "次へ" : "CONTINUE",
    savingCta: osIsJa ? "保存中..." : "SAVING...",
    selectLanguagePlaceholder: osIsJa
      ? "選択してください"
      : "Select",
    selectCountryPlaceholder: osIsJa ? "未設定" : "Not set",
  } as const;

  const canSubmit = displayName.trim().length > 0 && (language === "ja" || language === "en");
  const formWidth = resolvedVariant === "mobile" ? 328 : 390;
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
    if (!user || !canSubmit || !language) return;

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

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          width: formWidth,
          padding: 24,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 12,
          boxShadow: "0 0 30px rgba(0,0,0,0.3)",
          color: "white",
        }}
      >
        <h1
          style={{ fontWeight: "bold", fontSize: "1.45rem", textAlign: "center" }}
        >
          {ui.title}
        </h1>
        <p
          style={{
            marginTop: 6,
            textAlign: "center",
            opacity: 0.75,
            fontSize: "0.86rem",
          }}
        >
          {ui.subtitle}
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
          <label style={{ position: "relative", cursor: "pointer" }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "9999px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              {avatarFile ? (
                <img
                  src={URL.createObjectURL(avatarFile)}
                  alt="avatar preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </div>
            <span
              style={{
                position: "absolute",
                right: -4,
                bottom: -2,
                width: 30,
                height: 30,
                borderRadius: "9999px",
                background: "#111",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Camera size={15} />
            </span>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
            {ui.usernameLabel}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={ui.usernamePlaceholder}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
            {ui.languageLabel}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(17,24,39,0.95)",
              color: "white",
              outline: "none",
            }}
          >
            <option value="">{ui.selectLanguagePlaceholder}</option>
            <option value="ja">{osIsJa ? "日本語" : "Japanese"}</option>
            <option value="en">English</option>
          </select>
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
            {ui.countryLabel}
          </label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(17,24,39,0.95)",
              color: "white",
              outline: "none",
            }}
          >
            <option value="">{ui.selectCountryPlaceholder}</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {osIsJa ? c.labelJa : c.labelEn}
              </option>
            ))}
          </select>
          <p style={{ marginTop: 6, fontSize: "0.75rem", opacity: 0.65 }}>
            {ui.countryNote}
            {countryCode && !selectedCountryHasFlag
              ? ui.countryNoteLater
              : ""}
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || saving}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "12px 14px",
            marginTop: 16,
            border: "none",
            borderRadius: 14,
            color: "white",
            fontWeight: 700,
            letterSpacing: 0.4,
            background:
              "linear-gradient(90deg, #7C3AED 0%, #EC4899 50%, #06B6D4 100%)",
            boxShadow:
              "0 10px 30px rgba(124,58,237,0.25), 0 12px 34px rgba(6,182,212,0.22)",
            opacity: !canSubmit || saving ? 0.65 : 1,
            cursor: !canSubmit || saving ? "not-allowed" : "pointer",
            transform: pressed ? "scale(0.97)" : "scale(1)",
          }}
        >
          <span>
            {saving ? ui.savingCta : `${ui.continueCta}`}
          </span>
          <span style={{ fontSize: 18 }}>↗</span>
        </button>
      </div>
    </form>
  );
}
