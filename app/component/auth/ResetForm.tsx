"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

type Props = {
  variant?: "web" | "mobile";
};

export default function ResetForm({ variant = "web" }: Props) {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isEn = language === "en";

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const formWidth = variant === "mobile" ? 320 : 360;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (busy) return; // 二重送信防止

    const trimmed = email.trim();
    setMsg(null);
    setErr(null);

    if (!trimmed) {
      setErr(
        isEn ? "Please enter your email address." : "メールアドレスを入力してください。"
      );
      return;
    }

    try {
      setBusy(true);

      console.log("[reset] before sendPasswordResetEmail", { email: trimmed });

      // 10秒でタイムアウトさせて「止まってる」を可視化
      await Promise.race([
        sendPasswordResetEmail(auth, trimmed),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000)
        ),
      ]);

      console.log("[reset] success");
      setMsg(
        isEn
          ? "If this email is registered, we sent a reset link. Check spam if you don't see it."
          : "リセット用メールを送信しました。届かない場合は迷惑メールをご確認ください。"
      );
    } catch (e: any) {
      const code = e?.code as string | undefined;

      console.log("[reset] catch", code, e);

      if (e?.message === "timeout") {
        setErr(
          isEn
            ? "Request timed out. In DevTools → Network, check identitytoolkit / sendOobCode."
            : "送信処理がタイムアウトしました。DevToolsのNetworkで identitytoolkit / sendOobCode のリクエストを確認してください。"
        );
      } else if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        // 存在可否は伏せる：未登録でも成功表示
        setMsg(
          isEn
            ? "If this email is registered, we sent a reset link. Check spam if you don't see it."
            : "リセット用メールを送信しました。届かない場合は迷惑メールをご確認ください。"
        );
      } else if (code === "auth/too-many-requests") {
        setErr(
          isEn
            ? "Too many attempts. Please try again later."
            : "送信回数が多すぎます。時間をおいて再度お試しください。"
        );
      } else if (code === "auth/network-request-failed") {
        setErr(
          isEn
            ? "Network error. Check your connection."
            : "通信に失敗しました。ネットワーク接続をご確認ください。"
        );
      } else {
        setErr(
          isEn
            ? "Failed to send. Please try again in a moment."
            : "送信に失敗しました。しばらくしてから再度お試しください。"
        );
      }

      console.error("[reset] sendPasswordResetEmail error:", code, e);
    } finally {
      console.log("[reset] finally");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div
        style={{
          width: formWidth,
          padding: 24,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 12,
          textAlign: "center",
          boxShadow: "0 0 30px rgba(0,0,0,0.3)",
          color: "white",
        }}
      >
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 6 }}>
          {isEn ? "Reset password" : "パスワードをリセット"}
        </h1>
        <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>
          {isEn
            ? "We'll email a reset link to your registered address."
            : "登録メールアドレスにリセットリンクを送ります。"}
        </p>

        <div style={{ position: "relative", marginTop: 16 }}>
          <input
            type="email"
            placeholder={isEn ? "Email address" : "メールアドレス"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            autoComplete="email"
            inputMode="email"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: 16,
            border: "none",
            borderRadius: 9999,
            cursor: busy ? "not-allowed" : "pointer",
            fontWeight: 700,
            letterSpacing: 0.3,
            color: "white",
            background:
              "linear-gradient(90deg, #7C3AED 0%, #6D28D9 20%, #4F46E5 50%, #06B6D4 100%)",
            boxShadow:
              "0 10px 30px rgba(124,58,237,.25), 0 0 0 1px rgba(255,255,255,.08) inset",
            transition: "transform .06s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          {busy
            ? isEn
              ? "Sending…"
              : "送信中…"
            : isEn
              ? "Send reset link"
              : "リセットリンクを送信"}
        </button>

        {msg && (
          <div style={{ marginTop: 12, fontSize: 13, color: "#A7F3D0" }}>{msg}</div>
        )}
        {err && (
          <div style={{ marginTop: 12, fontSize: 13, color: "#FCA5A5" }}>{err}</div>
        )}

        <p style={{ marginTop: 18, fontSize: 13, opacity: 0.85 }}>
          {isEn ? "Back to " : "ログイン画面へ戻る: "}
          <a
            href={variant === "mobile" ? "/mobile/login" : "/web/login"}
            style={{ color: "#86e5ff", textDecoration: "underline", fontWeight: 700 }}
          >
            {isEn ? "Log in" : "ログイン"}
          </a>
        </p>
      </div>
    </form>
  );
}