// app/component/support/ContactForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Send, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import {
  CONTACT_TYPE_OPTIONS,
  type ContactType,
} from "@/lib/support/contactTypes";
import { submitContact } from "@/lib/support/submitContact";

import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

type Variant = "web" | "mobile";

export default function ContactForm({ variant }: { variant: Variant }) {
  const router = useRouter();
  const pathname = usePathname();

  const { fUser: user, status } = useFirebaseUser();

  const [handle, setHandle] = useState<string | null>(null);

  // 🔥 ログインユーザーの handle を Firestore から取得
  useEffect(() => {
    if (!user?.uid) return;

    const fetchHandle = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      setHandle(data?.handle ?? null);
    };

    fetchHandle();
  }, [user]);

  const [form, setForm] = useState({
    type: "bug" as ContactType,
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

  const baseContainerClass =
    "w-full rounded-2xl bg-slate-900/50 border border-white/5 shadow-xl backdrop-blur-sm";
  const paddingClass = variant === "web" ? "p-8 md:p-10" : "p-6 pb-7";

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
      newErrors.message = "お問い合わせ内容を入力してください。";
    } else if (form.message.trim().length < 10) {
      newErrors.message = "10文字以上で入力してください。";
    }

    if (form.email.trim()) {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!pattern.test(form.email.trim())) {
        newErrors.email = "メールアドレスの形式が正しくありません。";
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
    if (!user?.uid) {
      setSubmitError("ログインが必要です。");
      return;
    }

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
      setForm({ type: "bug", email: "", message: "", screenshotUrl: "" });
      setPreviewUrl(null);
      setSelectedFile(null);

    } catch (err) {
      console.error(err);
      setSubmitError("送信に失敗しました。再度お試しください。");
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
          <div className="rounded-full bg-emerald-500/10 p-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-emerald-200">
              お問い合わせが完了しました
            </h2>
            <p className="text-xs md:text-sm text-slate-100/80">
              数秒後にプロフィールへ戻ります…
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
        <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3 py-2.5 border border-rose-500/40">
          <AlertCircle className="mt-0.5 h-4 w-4 text-rose-300" />
          <p className="text-xs text-rose-100">{submitError}</p>
        </div>
      )}

      {/* 種別 */}
      <div className="space-y-1.5">
        <label className="text-xs md:text-sm text-sky-100">お問い合わせの種類</label>

        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as ContactType })}
          className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-3 py-3 text-sm text-slate-50"
        >
          {CONTACT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* メール */}
      <div className="space-y-1.5">
        <label className="text-xs md:text-sm text-sky-100">メールアドレス（任意）</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="返信が必要な場合はこちら"
          className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-3 py-2.5 text-xs md:text-sm text-slate-50"
        />
        {errors.email && <p className="text-[11px] text-rose-300">{errors.email}</p>}
      </div>

      {/* 内容 */}
      <div className="space-y-1.5">
        <label className="text-xs md:text-sm text-sky-100">お問い合わせ内容</label>
        <textarea
          rows={variant === "web" ? 6 : 5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-xl bg-slate-900/80 border border-white/10 px-3 py-2.5 text-xs md:text-sm text-slate-50 resize-none"
        />
        {errors.message && <p className="text-[11px] text-rose-300">{errors.message}</p>}
      </div>

      {/* 写真 */}
      <div className="space-y-1.5">
        <label className="text-xs md:text-sm text-sky-100">写真（任意）</label>

        <label
          className="flex items-center gap-3 rounded-xl bg-slate-900/80 border border-white/10 px-3 py-2 cursor-pointer"
        >
          <ImageIcon className="h-4 w-4 text-slate-300" />
          <span className="text-xs md:text-sm text-slate-300">写真を選択する</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            className="mt-2 w-full rounded-xl border border-white/10 max-h-60 object-cover"
            alt="preview"
          />
        )}
      </div>

      {/* ボタン */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting || uploading || !user}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-white shadow-lg disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting || uploading ? "送信中..." : "お問い合わせを送信する"}
        </button>
      </div>
    </form>
  );
}
