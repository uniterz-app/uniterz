"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { Camera, X } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db, auth } from "@/lib/firebase";
import { COUNTRY_OPTIONS } from "@/lib/rankings/country";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

type Language = "ja" | "en";

const TIMEZONE_BY_LANGUAGE: Record<Language, string> = {
  ja: "Asia/Tokyo",
  en: "America/New_York",
};

/** MatchCard「予想をする」と同じボタン見た目 */
const PREDICT_PRIMARY_BUTTON_STYLE: CSSProperties = {
  background: `
    radial-gradient(92% 230% at 50% 50%,
      rgba(59,130,246,0.92) 0%,
      rgba(37,99,235,0.88) 36%,
      rgba(29,78,216,0.58) 58%,
      rgba(29,78,216,0.20) 74%,
      rgba(29,78,216,0.05) 84%,
      rgba(29,78,216,0.00) 100%
    )
  `,
  boxShadow: "none",
};

const PREDICT_MUTED_BUTTON_STYLE: CSSProperties = {
  background: `
    radial-gradient(95% 220% at 50% 50%,
      rgba(148,163,184,0.22) 0%,
      rgba(100,116,139,0.14) 42%,
      rgba(71,85,105,0.06) 66%,
      rgba(71,85,105,0.00) 100%
    )
  `,
  boxShadow: "none",
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setReady(false);
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data() as Record<string, unknown>;
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
    if (!user) {
      alert(isEn ? "Login is required." : "ログインが必要です");
      return;
    }

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

  const panel = (
    <div
      onClick={(e) => {
        if (!embedded) e.stopPropagation();
      }}
      className={[
        "w-full max-w-[480px] max-h-[min(90dvh,760px)] overflow-y-auto rounded-2xl",
        "border border-white/12 bg-black/25 text-white shadow-2xl",
        "backdrop-blur-2xl",
        "px-5 py-5 sm:px-6 sm:py-6",
      ].join(" ")}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base font-semibold leading-tight">
            {isEn ? "Profile Settings" : "プロフィール設定"}
          </h1>
          <p className="mt-0.5 text-xs text-white/60">
            {isEn
              ? "Edit your icon, name, bio, language, and country."
              : "アイコン・名前・自己紹介・言語・国を編集できます"}
          </p>
        </div>
        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10"
            aria-label={isEn ? "Close" : "閉じる"}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </header>

      {!ready ? (
        <div className="py-10 text-center text-sm text-white/50">
          {isEn ? "Loading…" : "読み込み中…"}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex justify-center">
            <label className="relative inline-block cursor-pointer">
              <div className="relative h-32 w-32 overflow-hidden rounded-full sm:h-36 sm:w-36">
                <img
                  src={previewURL}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: `center ${cropY}%` }}
                />
                <div className="absolute inset-0 rounded-full ring-4 ring-black/40" />
              </div>
              <span
                className="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.4)] ring-2 ring-white/10"
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

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/70">
              {isEn ? "Name" : "名前"}
            </label>
            <input
              type="text"
              placeholder={isEn ? "Name" : "名前"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/70">
              {isEn ? "Bio" : "自己紹介"}
            </label>
            <textarea
              placeholder={isEn ? "Bio" : "自己紹介"}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[96px] w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/70">
              {isEn ? "App Language" : "使用言語"}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60"
            >
              <option value="ja">{isEn ? "Japanese" : "日本語"}</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/70">
              {isEn ? "Country (optional)" : "住んでいる国（任意）"}
            </label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60"
            >
              <option value="">{isEn ? "Not set" : "未設定"}</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {language === "ja" ? c.labelJa : c.labelEn}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={
              uploading ? PREDICT_MUTED_BUTTON_STYLE : PREDICT_PRIMARY_BUTTON_STYLE
            }
            className={[
              "mt-1 grid w-full place-items-center font-bold text-white",
              "h-10 text-[13px] px-2 md:h-12 md:text-[15px]",
              "rounded-md",
              "transition-all duration-200",
              uploading
                ? "cursor-not-allowed"
                : "cursor-pointer active:scale-[0.985]",
            ].join(" ")}
          >
            {uploading
              ? isEn
                ? "Uploading..."
                : "アップロード中..."
              : isEn
                ? "Save Changes"
                : "変更を保存"}
          </button>
        </form>
      )}
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
      className="fixed inset-0 z-[1000001] flex items-end justify-center bg-transparent p-3 backdrop-blur-2xl sm:items-center sm:p-4"
      style={{ WebkitBackdropFilter: "blur(24px)" }}
    >
      {panel}
    </div>
  );
}
