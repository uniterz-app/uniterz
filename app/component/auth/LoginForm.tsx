"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type LoginFormProps = {
  variant?: "web" | "mobile";
};

export default function LoginForm({ variant = "web" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 👁 パスワード表示切り替え
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  // ログイン状態監視
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      const d = snap.data() as any;
      const handle = d?.handle || d?.username;
      if (handle) {
        const base = variant === "mobile" ? "/mobile/u" : "/web/u";
        router.replace(`${base}/${encodeURIComponent(handle)}`);
      }
    });
    return () => unsub();
  }, [router, variant]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const snap = await getDoc(doc(db, "users", user.uid));
      const d = snap.data() as any;
      const handle = d?.handle || d?.username;
      const base = variant === "mobile" ? "/mobile/u" : "/web/u";
      if (handle) router.replace(`${base}/${encodeURIComponent(handle)}`);
    } catch (error: any) {
      console.error("ログイン失敗:", error);
      alert(error.message ?? "Login failed");
    }
  };

  const formWidth = variant === "mobile" ? 320 : 360;

  return (
    <form onSubmit={handleLogin}>
      <div
        style={{
          width: formWidth,
          padding: 24,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 12,
          textAlign: "center",
          boxShadow: "0 0 30px rgba(0,0,0,0.3)",
        }}
      >
        <h1 style={{ fontWeight: "bold", fontSize: "1.7rem" }}>Login</h1>

        {/* Email */}
        <div style={{ position: "relative", marginTop: 16 }}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <FaEnvelope
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* Password */}
<div style={{ position: "relative", marginTop: 10 }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{
      width: "100%",
      padding: "12px 40px 12px 12px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.12)",
      color: "white",
      outline: "none",
    }}
  />

  {/* 👁 目アイコン（正しい動き） */}
  {showPassword ? (
    // ← パスワードが見えてる時 → 目アイコン
    <FaEye
      onClick={() => setShowPassword(false)}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        opacity: 0.9,
        cursor: "pointer",
      }}
    />
  ) : (
    // ← パスワードが隠れてる時 → 斜線アイコン
    <FaEyeSlash
      onClick={() => setShowPassword(true)}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        opacity: 0.9,
        cursor: "pointer",
      }}
    />
  )}
</div>


        {/* === Gradient Login Button（逆向き） === */}
        <button
          type="submit"
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
              "linear-gradient(90deg, #06B6D4 0%, #EC4899 50%, #7C3AED 100%)",
            boxShadow:
              "0 10px 30px rgba(6,182,212,0.25), 0 12px 34px rgba(124,58,237,0.22)",
            transition: "transform .06s ease, filter .15s ease, box-shadow .15s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.06)";
            e.currentTarget.style.boxShadow =
              "0 12px 36px rgba(6,182,212,0.30), 0 16px 42px rgba(124,58,237,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "brightness(1.0)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(6,182,212,0.25), 0 12px 34px rgba(124,58,237,0.22)";
          }}
        >
          <span>LOG IN</span>
          <span style={{ fontSize: 18, lineHeight: 1 }}>↗</span>
        </button>

        {/* Reset */}
        <p style={{ marginTop: 12, fontSize: "0.85rem", opacity: 0.9 }}>
          パスワードをお忘れの方は{" "}
          <Link
            href={variant === "mobile" ? "/mobile/reset" : "/web/reset"}
            style={{
              color: "#7DD3FC",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            こちら
          </Link>
        </p>

        {/* Signup */}
        <p style={{ marginTop: 10 }}>
          アカウントを{" "}
          <Link
            href={variant === "mobile" ? "/mobile/signup" : "/web/signup"}
            style={{
              color: "#7DD3FC",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            新規作成
          </Link>
        </p>
      </div>
    </form>
  );
}
