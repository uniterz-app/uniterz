"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Props = {
  variant?: "web" | "mobile";          // 背景余白や幅の微調整用
};

export default function ResetForm({ variant = "web" }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState<string | null>(null);
  const [err, setErr]     = useState<string | null>(null);

  const formWidth = variant === "mobile" ? 320 : 360;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    // 簡易バリデーション
    if (!email.trim()) {
      setErr("メールアドレスを入力してください。");
      return;
    }

    try {
      setBusy(true);
      // 重要：存在可否は伏せる（常に同じメッセージ）
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("リセット用メールを送信しました。届かない場合は迷惑メールをご確認ください。");
    } catch (e: any) {
      // 具体的な理由は出さない（セキュリティ的配慮）
      setErr("送信に失敗しました。しばらくしてから再度お試しください。");
      console.error(e);
    } finally {
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
          パスワードをリセット
        </h1>
        <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>
          登録メールアドレスにリセットリンクを送ります。
        </p>

        <div style={{ position: "relative", marginTop: 16 }}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
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

        {/* グラデボタン：紫 → シアン */}
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
          onMouseDown={(e) => ((e.currentTarget.style.transform = "translateY(1px)"))}
          onMouseUp={(e) => ((e.currentTarget.style.transform = "translateY(0)"))}
        >
          {busy ? "送信中…" : "リセットリンクを送信"}
        </button>

        {msg && (
          <div style={{ marginTop: 12, fontSize: 13, color: "#A7F3D0" }}>{msg}</div>
        )}
        {err && (
          <div style={{ marginTop: 12, fontSize: 13, color: "#FCA5A5" }}>{err}</div>
        )}

        <p style={{ marginTop: 18, fontSize: 13, opacity: 0.85 }}>
          ログイン画面へ戻る:{" "}
          <a
            href={variant === "mobile" ? "/mobile/login" : "/web/login"}
            style={{ color: "#86e5ff", textDecoration: "underline", fontWeight: 700 }}
          >
            ログイン
          </a>
        </p>
      </div>
    </form>
  );
}
