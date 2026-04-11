"use client";

import { useState, useEffect } from "react";
import { Camera, X, User } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db, auth } from "@/lib/firebase";
import { COUNTRY_OPTIONS } from "@/lib/rankings/country";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import CyberAuthField from "@/app/component/auth/CyberAuthField";
import CyberAuthTextarea from "@/app/component/auth/CyberAuthTextarea";
import CyberAuthSelect from "@/app/component/auth/CyberAuthSelect";
import cyberFieldStyles from "@/app/component/auth/cyberAuthField.module.css";

type Language = "ja" | "en";

const TIMEZONE_BY_LANGUAGE: Record<Language, string> = {
  ja: "Asia/Tokyo",
  en: "America/New_York",
};

type Props = {
  onClose: () => void;
  onSaved?: () => void;
  /** 別コンテナに埋め込むときは true（オーバーレイなし） */
  embedded?: boolean;
};

export default function ProfileEditSheet({
  onClose,
  onSaved,
  embedded = false,
}: Props) {
  const osIsJa =
    typeof navigator !== "undefined" &&
    navigator.language?.toLowerCase().startsWith("ja");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [language, setLanguage] = useState<Language>(() =>
    osIsJa ? "ja" : "en"
  );
  const isEn = language === "en";
  const [countryCode, setCountryCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | null>(null);
  const [cropY, setCropY] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [ready, setReady] = useState(false);
  const [savePressed, setSavePressed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setReady(false);
        return;
      }
      const d = (await getUserDocDataCached(user.uid)) as Record<
        string,
        unknown
      > | null;
      if (d) {
        setName(typeof d.displayName === "string" ? d.displayName : "");
        setBio(typeof d.bio === "string" ? d.bio : "");
        setCurrentPhotoURL(typeof d.photoURL === "string" ? d.photoURL : null);
        if (d.language === "ja" || d.language === "en") {
          setLanguage(d.language);
        } else {
          setLanguage(osIsJa ? "ja" : "en");
        }
        setCountryCode(typeof d.countryCode === "string" ? d.countryCode : "");
        if (typeof d.photoCropY === "number") setCropY(d.photoCropY);
      }
      setReady(true);
    });
    return () => unsub();
  }, [osIsJa]);

  const defaultAvatarUrl =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="%23000"/></svg>';

  const previewURL = selectedFile
    ? URL.createObjectURL(selectedFile)
    : currentPhotoURL || defaultAvatarUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return undefined;
    const user = auth.currentUser;
    if (!user) return undefined;
    try {
      setUploading(true);
      const timestamp = Date.now();
      const fileRef = ref(
        storage,
        `avatars/${user.uid}/${timestamp}_${selectedFile.name}`
      );
      await uploadBytes(fileRef, selectedFile);
      return await getDownloadURL(fileRef);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    let photoURL: string | null = currentPhotoURL;
    if (selectedFile) {
      const uploaded = await handleUpload();
      if (uploaded) photoURL = uploaded;
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        displayName: name || "",
        bio: bio || "",
        photoURL: photoURL || "",
        photoCropY: cropY,
        language,
        locale: language,
        timeZone: TIMEZONE_BY_LANGUAGE[language],
        countryCode: countryCode || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    onSaved?.();
    onClose();
  };

  const cardShell = [
    "relative isolate mx-auto w-full max-w-[480px] max-h-[min(90dvh,760px)] overflow-y-auto overflow-x-hidden",
    "rounded-2xl border border-white/10 bg-black/55 shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-md",
    "px-5 py-5 sm:px-6 sm:py-6",
  ].join(" ");

  const panel = (
    <div
      onClick={(e) => {
        if (!embedded) e.stopPropagation();
      }}
      className={cardShell}
    >
      <div className={cyberFieldStyles.pageGrid} aria-hidden />
      <div className="relative z-10">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isEn ? "Profile Settings" : "プロフィール設定"}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {isEn
                ? "Edit your icon, name, bio, language, and country."
                : "アイコン・名前・自己紹介・言語・国を編集できます"}
            </p>
          </div>
          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90 hover:bg-white/10"
              aria-label={isEn ? "Close" : "閉じる"}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        {!ready ? (
          <div className="py-12 text-center text-sm text-white/55">
            {isEn ? "Loading…" : "読み込み中…"}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
            <div className="flex justify-center">
              <label className="relative inline-block cursor-pointer">
                <div className="relative h-32 w-32 overflow-hidden rounded-full ring-2 ring-white/10 ring-offset-2 ring-offset-black/40 sm:h-36 sm:w-36">
                  <img
                    src={previewURL}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: `center ${cropY}%` }}
                  />
                  <div className="absolute inset-0 rounded-full ring-2 ring-black/30" />
                </div>
                <span
                  className="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/15 bg-black/70 text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
                  aria-hidden
                >
                  <Camera className="h-4 w-4" />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/75">
                {isEn ? "Name" : "名前"}
              </label>
              <CyberAuthField
                inputProps={{
                  type: "text",
                  name: "displayName",
                  autoComplete: "name",
                  placeholder: isEn ? "Name" : "名前",
                  value: name,
                  onChange: (e) => setName(e.target.value),
                }}
                rightSlot={
                  <span className="flex items-center justify-center text-[15px] text-white/80">
                    <User className="h-4 w-4" aria-hidden />
                  </span>
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/75">
                {isEn ? "Bio" : "自己紹介"}
              </label>
              <CyberAuthTextarea
                textareaProps={{
                  name: "bio",
                  placeholder: isEn ? "Bio" : "自己紹介",
                  value: bio,
                  onChange: (e) => setBio(e.target.value),
                  rows: 4,
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/75">
                {isEn ? "App Language" : "使用言語"}
              </label>
              <CyberAuthSelect
                selectProps={{
                  value: language,
                  onChange: (e) => setLanguage(e.target.value as Language),
                }}
              >
                <option value="ja">{isEn ? "Japanese" : "日本語"}</option>
                <option value="en">English</option>
              </CyberAuthSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/75">
                {isEn ? "Country (optional)" : "住んでいる国（任意）"}
              </label>
              <CyberAuthSelect
                selectProps={{
                  value: countryCode,
                  onChange: (e) => setCountryCode(e.target.value),
                }}
              >
                <option value="">{isEn ? "Not set" : "未設定"}</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {language === "ja" ? c.labelJa : c.labelEn}
                  </option>
                ))}
              </CyberAuthSelect>
            </div>

            <button
              type="submit"
              disabled={uploading}
              onPointerDown={() => setSavePressed(true)}
              onPointerUp={() => setSavePressed(false)}
              onPointerCancel={() => setSavePressed(false)}
              className={[
                "mt-1 flex w-full items-center justify-center gap-2 rounded-[14px] border-0 px-3.5 py-3 font-bold tracking-wide text-white",
                "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-violet-600",
                "shadow-[0_10px_30px_rgba(6,182,212,0.25),0_12px_34px_rgba(124,58,237,0.22)]",
                "transition-[transform,filter,opacity] duration-100 ease-out",
                savePressed && !uploading ? "scale-[0.97]" : "scale-100",
                uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              ].join(" ")}
            >
              <span>
                {uploading
                  ? isEn
                    ? "Uploading..."
                    : "アップロード中..."
                  : isEn
                    ? "Save changes"
                    : "変更を保存"}
              </span>
              {!uploading ? (
                <span className="text-lg leading-none">↗</span>
              ) : null}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return panel;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-1000001 flex items-end justify-center bg-black/50 p-3 backdrop-blur-md sm:items-center sm:p-4"
      style={{ WebkitBackdropFilter: "blur(16px)" }}
    >
      {panel}
    </div>
  );
}
