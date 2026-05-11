"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaLock } from "react-icons/fa";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import SettingsNeonCard from "@/app/component/settings/SettingsNeonCard";

type Props = {
  variant?: "web" | "mobile";
};

export default function ChangePasswordForm({ variant = "web" }: Props) {
  const router = useRouter();
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [nextConfirm, setNextConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const formWidth = variant === "mobile" ? 320 : 380;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        alert(m.auth.loginRequired);
        return;
      }

      if (!current || !next) {
        alert(m.settings.currentPassword);
        return;
      }

      if (next !== nextConfirm) {
        alert(m.settings.passwordsNoMatch);
        return;
      }

      setLoading(true);

      // 1) 再認証（現在のパスワードが正しいか確認）
      const cred = EmailAuthProvider.credential(
        auth.currentUser.email,
        current
      );
      await reauthenticateWithCredential(auth.currentUser, cred);

      // 2) パスワード更新
      await updatePassword(auth.currentUser, next);

      alert(m.settings.passwordUpdated);
      setCurrent("");
      setNext("");
      setNextConfirm("");

      // 変更後はとりあえずプロフィールに戻す（必要なら変更）
      const base = variant === "mobile" ? "/mobile/settings/profile" : "/web/settings/profile";
      router.push(base);
    } catch (err: any) {
      console.error("change password error:", err);
      if (err?.code === "auth/wrong-password") {
        alert(m.settings.currentPasswordWrong);
      } else if (err?.code === "auth/weak-password") {
        alert(m.settings.passwordChangeFailed);
      } else {
        alert(err?.message ?? m.settings.passwordChangeFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <SettingsNeonCard
        className="mx-auto text-center"
        style={{ width: formWidth }}
      >
        <h1
          style={{
            fontWeight: "bold",
            fontSize: "1.4rem",
            marginBottom: 4,
          }}
        >
          {m.settings.changePassword}
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            opacity: 0.8,
            marginBottom: 16,
          }}
        >
          {m.settings.changePasswordDesc}
        </p>

        {/* 現在のパスワード */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <input
            type="password"
            placeholder={m.settings.currentPassword}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(15,23,42,0.75)",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <FaLock
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* 新しいパスワード */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <input
            type="password"
            placeholder={m.settings.newPassword}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(15,23,42,0.75)",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <FaLock
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* 新しいパスワード（確認） */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <input
            type="password"
            placeholder={m.settings.confirmNewPassword}
            value={nextConfirm}
            onChange={(e) => setNextConfirm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(15,23,42,0.75)",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <FaLock
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundImage:
              "linear-gradient(135deg, #a855f7, #6366f1 40%, #22d3ee 100%)",
            color: "white",
            width: "100%",
            padding: "12px",
            marginTop: 18,
            border: "none",
            borderRadius: 999,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
            letterSpacing: "0.03em",
            boxShadow: "0 0 18px rgba(79,70,229,0.7)",
            opacity: loading ? 0.7 : 1,
            transition: "transform 0.1s ease, box-shadow 0.1s ease",
          }}
        >
          {loading
            ? m.common.saving
            : m.settings.changePassword}
        </button>
      </SettingsNeonCard>
    </form>
  );
}
