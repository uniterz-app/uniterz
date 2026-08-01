"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Camera, User } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "@/lib/firebase";
import { COUNTRY_OPTIONS } from "@/lib/rankings/country";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";
import CyberAuthField from "@/app/component/auth/CyberAuthField";
import CyberAuthTextarea from "@/app/component/auth/CyberAuthTextarea";
import CyberAuthSelect from "@/app/component/auth/CyberAuthSelect";
import {
  SETTINGS_POOLS_BG_BASE,
  SETTINGS_POOLS_BG_IMAGE,
} from "@/lib/ui/settingsPoolsBackground";
import type { Language } from "@/lib/i18n/language";
import {
  ALL_LANGUAGES,
  LANGUAGE_NATIVE_NAMES,
  guessLanguageFromNavigator,
  normalizeLanguage,
} from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { saveMeProfile } from "@/lib/api/saveMeProfile";
import {
  isProfileGamblingTermsError,
  profileGamblingTermsUserMessage,
} from "@/lib/profile/profileGamblingTerms";

type Props = {
  onClose: () => void;
  onSaved?: () => void;
  /** 別コンテナに埋め込むときは true（オーバーレイなし） */
  embedded?: boolean;
  /** 戻るで閉じたあとサイドメニューを再度開く（保存成功時は呼ばない） */
  reopenMenu?: () => void;
};

export default function ProfileEditSheet({
  onClose,
  onSaved,
  embedded = false,
  reopenMenu,
}: Props) {
  const pathname = usePathname() ?? "";
  const isWeb = pathname.startsWith("/web");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [language, setLanguage] = useState<Language>(() =>
    guessLanguageFromNavigator()
  );
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
        const norm = normalizeLanguage(d.language);
        setLanguage(norm ?? guessLanguageFromNavigator());
        setCountryCode(typeof d.countryCode === "string" ? d.countryCode : "");
        if (typeof d.photoCropY === "number") setCropY(d.photoCropY);
      }
      setReady(true);
    });
    return () => unsub();
  }, []);

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

    try {
      await saveMeProfile({
        displayName: name || "",
        bio: bio || "",
        photoURL: photoURL || "",
        language,
        countryCode: countryCode || null,
        photoCropY: cropY,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      if (isProfileGamblingTermsError(err)) {
        alert(profileGamblingTermsUserMessage(language));
        return;
      }
      alert(t(language).common.saveFailed);
    }
  };

  /** 戻る：シートを閉じてからサイドメニューを開き直す */
  const handleDismiss = () => {
    onClose();
    window.setTimeout(() => {
      reopenMenu?.();
    }, 30);
  };

  const formBody = !ready ? (
    <div className="flex justify-center py-12">
      <CandleChartLoader label={t(language).common.loading} />
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
          {t(language).profile.username}
        </label>
        <CyberAuthField
          inputProps={{
            type: "text",
            name: "displayName",
            autoComplete: "name",
            placeholder: t(language).profile.username,
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
          {t(language).profile.bio}
        </label>
        <CyberAuthTextarea
          textareaProps={{
            name: "bio",
            placeholder: t(language).profile.bio,
            value: bio,
            onChange: (e) => setBio(e.target.value),
            rows: 4,
          }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/75">
          {t(language).profile.appLanguage}
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

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/75">
          {t(language).auth.countryOptional}
        </label>
        <CyberAuthSelect
          selectProps={{
            value: countryCode,
            onChange: (e) => setCountryCode(e.target.value),
          }}
        >
          <option value="">{t(language).common.notSet}</option>
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
            ? t(language).profile.uploading
            : t(language).profile.saveChanges}
        </span>
        {!uploading ? (
          <span className="text-lg leading-none">↗</span>
        ) : null}
      </button>
    </form>
  );

  if (embedded) {
    return (
      <div
        className={[
          "relative mx-auto w-full px-5 py-5",
          isWeb ? "max-w-2xl" : "max-w-[480px]",
        ].join(" ")}
      >
        <h1 className="mb-5 text-2xl font-bold tracking-tight text-white">
          {t(language).profile.settings}
        </h1>
        {formBody}
      </div>
    );
  }

  /** 他プロフィールサブページと同様: sticky ヘッダー + 本文スクロール */
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 isolate min-h-dvh overflow-y-auto overscroll-contain"
      style={{ zIndex: 2147483000 }}
    >
      {/* クラス依存せず不透明ベース + Pools を必ず塗る（プロフィール透け防止） */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundColor: SETTINGS_POOLS_BG_BASE,
          backgroundImage: SETTINGS_POOLS_BG_IMAGE,
          backgroundRepeat: "no-repeat",
        }}
      />
      <CyberSubpageShell
        bare
        eyebrow="PROFILE"
        title="SETTINGS"
        subtitle={
          language === "en"
            ? "Edit your icon, name, bio, language, and country."
            : "アイコン・名前・自己紹介・言語・国を編集できます"
        }
        onBack={handleDismiss}
        backAriaLabel={t(language).common.back}
        contentClassName={
          isWeb
            ? "max-w-2xl px-6 py-6 pb-28 md:px-8"
            : "max-w-lg px-4 py-5 pb-28"
        }
      >
        {formBody}
      </CyberSubpageShell>
    </div>
  );
}
