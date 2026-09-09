// app/component/support/ContactForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Send, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import {
  CONTACT_TYPE_OPTIONS,
  type ContactType,
} from "@/lib/support/contactTypes";
import { submitContact } from "@/lib/support/submitContact";

import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { getUserDocDataCached, readUserHandleFromDoc } from "@/lib/user/userDocCache";

type Variant = "web" | "mobile";
type ContactFormProps = {
  variant: Variant;
  initialType?: ContactType;
  hideTypeSelect?: boolean;
};

const CONTACT_TYPE_KEYS: Record<ContactType, "contactTypeBug" | "contactTypeFeature" | "contactTypeReport" | "contactTypeOther"> = {
  bug: "contactTypeBug",
  feature: "contactTypeFeature",
  report: "contactTypeReport",
  other: "contactTypeOther",
};

const fieldClass =
  "w-full border border-white/20 bg-black px-3 py-2.5 text-xs md:text-sm text-white outline-none focus:border-white/45";
const labelClass = "text-xs md:text-sm text-white/70";

export default function ContactForm({
  variant,
  initialType = "bug",
  hideTypeSelect = false,
}: ContactFormProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);

  const [handle, setHandle] = useState<string | null>(null);

  // 🔥 ログインユーザーの handle を Firestore から取得
  useEffect(() => {
    if (!user?.uid) return;

    const fetchHandle = async () => {
      const data = await getUserDocDataCached(user.uid);
      setHandle(readUserHandleFromDoc(data));
    };

    fetchHandle();
  }, [user]);

  const [form, setForm] = useState({
    type: initialType,
    email: "",
    message: "",
    screenshotUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, type: initialType }));
  }, [initialType]);

  const baseContainerClass = "w-full border border-white/20 bg-black";
  const paddingClass = variant === "web" ? "p-8 md:p-10" : "p-6 pb-7";

  const contactTypeOptions = CONTACT_TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: m.support[CONTACT_TYPE_KEYS[o.value]],
  }));

  // -----------------------------
  // 写真選択
  // -----------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // -----------------------------
  // Storage アップロード
  // -----------------------------
  const uploadScreenshot = async () => {
    if (!selectedFile || !user?.uid) return "";

    setUploading(true);

    const uid = user.uid;
    const fileId = uuidv4();

    const fileRef = ref(storage, `contact_screenshots/${uid}/${fileId}`);
    await uploadBytes(fileRef, selectedFile);
    const url = await getDownloadURL(fileRef);

    setUploading(false);
    return url;
  };

  // -----------------------------
  // バリデーション
  // -----------------------------
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.message.trim()) {
      newErrors.message = m.support.validationRequired;
    } else if (form.message.trim().length < 10) {
      newErrors.message = m.support.validationMinLength;
    }

    if (form.email.trim()) {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!pattern.test(form.email.trim())) {
        newErrors.email = m.support.validationEmailInvalid;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -----------------------------
  // 送信処理
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!user?.uid) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      let screenshotUrl = "";
      if (selectedFile) screenshotUrl = await uploadScreenshot();

      await submitContact({
        type: form.type,
        message: form.message.trim(),
        email: form.email.trim() || undefined,
        screenshotUrl: screenshotUrl || undefined,
        fromPath: pathname,
        appVariant: variant,
        userUid: user.uid,
        userDisplayName: user.displayName ?? null,
      });

      setSubmitted(true);
      setForm({ type: initialType, email: "", message: "", screenshotUrl: "" });
      setPreviewUrl(null);
      setSelectedFile(null);

    } catch (err) {
      console.error(err);
      setSubmitError(m.support.sendFailed);
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------
  // 成功後リダイレクト（正しいプロフィールへ）
  // -----------------------------
  useEffect(() => {
    if (!submitted || !handle) return;

    const redirectTo = variant === "web"
      ? `/web/u/${handle}`
      : `/mobile/u/${handle}`;

    const t = setTimeout(() => {
      router.push(redirectTo);
    }, 2000);

    return () => clearTimeout(t);
  }, [submitted, handle, variant, router]);

  // -----------------------------
  // 成功画面
  // -----------------------------
  if (submitted) {
    return (
      <div className={`${baseContainerClass} ${paddingClass}`}>
        <div className="flex items-start gap-3">
          <div className="border border-white/30 bg-black p-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-white">
              {m.support.sent}
            </h2>
            <p className="text-xs md:text-sm text-white/70">
              {m.support.returnToProfile}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // フォーム本体
  // -----------------------------
  return (
    <form onSubmit={handleSubmit} className={`${baseContainerClass} ${paddingClass} space-y-6`}>

      {/* エラー表示 */}
      {submitError && (
        <div className="flex items-start gap-2 border border-white/25 bg-black px-3 py-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-white" />
          <p className="text-xs text-white/85">{submitError}</p>
        </div>
      )}

      {!hideTypeSelect && (
        <div className="space-y-1.5">
          <label className={labelClass}>
            {m.support.contactType}
          </label>

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as ContactType })}
            className={fieldClass}
          >
            {contactTypeOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-black text-white">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* メール */}
      <div className="space-y-1.5">
        <label className={labelClass}>
          {m.support.email}
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder={m.support.emailPlaceholder}
          className={fieldClass}
        />
        {errors.email && <p className="text-[11px] text-white/80">{errors.email}</p>}
      </div>

      {/* 内容 */}
      <div className="space-y-1.5">
        <label className={labelClass}>
          {m.support.message}
        </label>
        <textarea
          rows={variant === "web" ? 6 : 5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${fieldClass} resize-none`}
        />
        {errors.message && <p className="text-[11px] text-white/80">{errors.message}</p>}
      </div>

      {/* 写真 */}
      <div className="space-y-1.5">
        <label className={labelClass}>
          {m.support.attachImage}
        </label>

        <label
          className="flex cursor-pointer items-center gap-3 border border-white/20 bg-black px-3 py-2.5 transition-colors hover:border-white/40"
        >
          <ImageIcon className="h-4 w-4 text-white/70" />
          <span className="text-xs md:text-sm text-white/70">
            {m.support.attachImage}
          </span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            className="mt-2 w-full border border-white/20 max-h-60 object-cover"
            alt="preview"
          />
        )}
      </div>

      {/* ボタン */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting || uploading || !user}
          className="inline-flex items-center gap-2 border border-white bg-white px-5 py-2.5 text-xs md:text-sm font-semibold text-black disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitting || uploading
            ? m.support.sending
            : m.support.send}
        </button>
      </div>
    </form>
  );
}
