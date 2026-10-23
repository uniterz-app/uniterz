// app/component/support/ContactForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Send, AlertCircle, CheckCircle2, Image as ImageIcon, X } from "lucide-react";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import {
  CONTACT_DEVICE_KINDS,
  contactDeviceKindLabel,
  type ContactDeviceKind,
} from "@/lib/support/contactDevice";
import {
  CONTACT_TYPE_OPTIONS,
  type ContactType,
} from "@/lib/support/contactTypes";
import { submitContact } from "@/lib/support/submitContact";
import {
  CONTACT_SCREENSHOT_MAX_BYTES,
  contactScreenshotContentType,
} from "@/lib/support/contactScreenshot";

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
    deviceKind: "" as "" | ContactDeviceKind,
  });

  // ログイン済みのメールを初期表示する。手入力後は上書きしない
  useEffect(() => {
    const accountEmail = user?.email?.trim() ?? "";
    if (!accountEmail) return;
    setForm((prev) =>
      prev.email.trim() ? prev : { ...prev, email: accountEmail }
    );
  }, [user?.email]);

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
  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!contactScreenshotContentType(file.type)) {
      setErrors((prev) => ({ ...prev, image: m.support.attachImageInvalid }));
      return;
    }
    if (file.size > CONTACT_SCREENSHOT_MAX_BYTES) {
      setErrors((prev) => ({ ...prev, image: m.support.attachImageTooLarge }));
      return;
    }

    setErrors((prev) => {
      if (!prev.image) return prev;
      const next = { ...prev };
      delete next.image;
      return next;
    });
    setSelectedFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  // -----------------------------
  // Storage アップロード
  // -----------------------------
  const uploadScreenshot = async () => {
    if (!selectedFile || !user?.uid) return "";

    const contentType = contactScreenshotContentType(selectedFile.type);
    if (!contentType) {
      throw new Error("invalid_image");
    }
    if (selectedFile.size > CONTACT_SCREENSHOT_MAX_BYTES) {
      throw new Error("image_too_large");
    }

    setUploading(true);
    try {
      const fileRef = ref(storage, `contact_screenshots/${user.uid}/${uuidv4()}`);
      await uploadBytes(fileRef, selectedFile, { contentType });
      return await getDownloadURL(fileRef);
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------
  // バリデーション
  // -----------------------------
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.deviceKind) {
      newErrors.device = m.support.validationDeviceRequired;
    }

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

    if (errors.image) newErrors.image = errors.image;

    setErrors(newErrors);
    const blocking = { ...newErrors };
    delete blocking.image;
    return Object.keys(blocking).length === 0;
  };

  // -----------------------------
  // 送信処理
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!user?.uid || !form.deviceKind) return;

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
        deviceKind: form.deviceKind,
      });

      setSubmitted(true);
      setForm({
        type: initialType,
        email: "",
        message: "",
        screenshotUrl: "",
        deviceKind: "",
      });
      clearImage();

    } catch (err) {
      console.error(err);
      const code = err instanceof Error ? err.message : "";
      setSubmitError(
        code === "invalid_device"
          ? m.support.validationDeviceRequired
          : code === "image_too_large"
            ? m.support.attachImageTooLarge
            : code === "invalid_image"
              ? m.support.attachImageInvalid
              : m.support.sendFailed
      );
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

      <div className="space-y-1.5">
        <label className={labelClass}>{m.support.deviceLabel}</label>
        <select
          value={form.deviceKind}
          onChange={(e) =>
            setForm({
              ...form,
              deviceKind: e.target.value as "" | ContactDeviceKind,
            })
          }
          className={fieldClass}
        >
          <option value="" disabled className="bg-black text-white">
            {m.support.devicePlaceholder}
          </option>
          {CONTACT_DEVICE_KINDS.map((kind) => (
            <option key={kind} value={kind} className="bg-black text-white">
              {contactDeviceKindLabel(kind)}
            </option>
          ))}
        </select>
        {errors.device ? (
          <p className="text-[11px] text-white/80">{errors.device}</p>
        ) : null}
      </div>

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

      {/* 写真（任意・1枚・8MBまで） */}
      <div className="space-y-1.5">
        <label className={labelClass}>
          {m.support.photoOptional}
        </label>

        <label
          className="flex cursor-pointer items-center gap-3 border border-white/20 bg-black px-3 py-2.5 transition-colors hover:border-white/40"
        >
          <ImageIcon className="h-4 w-4 text-white/70" />
          <span className="text-xs md:text-sm text-white/70">
            {m.support.attachImage}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {errors.image ? (
          <p className="text-[11px] text-white/80">{errors.image}</p>
        ) : null}

        {previewUrl && (
          <div className="relative mt-2">
            <img
              src={previewUrl}
              className="w-full border border-white/20 max-h-60 object-contain"
              alt=""
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-2 top-2 inline-flex items-center gap-1 border border-white/30 bg-black/80 px-2 py-1 text-[11px] text-white"
            >
              <X className="h-3 w-3" />
              {m.support.attachImageRemove}
            </button>
          </div>
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
