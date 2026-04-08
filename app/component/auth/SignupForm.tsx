"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type SignupFormProps = {
  variant?: "web" | "mobile";
};

export default function SignupForm({ variant = "web" }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pressed, setPressed] = useState(false);

  const router = useRouter();

  // SSR と初回クライアントで同じ文言にする（navigator はマウント後に反映）
  const [isJa, setIsJa] = useState(true);

  useEffect(() => {
    setIsJa(
      typeof navigator !== "undefined" &&
        navigator.language?.toLowerCase().startsWith("ja")
    );
  }, []);

  const ui = useMemo(
    () => ({
      title: isJa ? "アカウント作成" : "Create Account",
      emailPlaceholder: isJa ? "メールアドレス" : "Email Address",
      passwordPlaceholder: isJa ? "パスワード" : "Password",
      signupCta: isJa ? "サインアップ" : "SIGN UP",
      alreadyText: isJa
        ? "すでにアカウントをお持ちの方は"
        : "Already have an account?",
      loginText: isJa ? "ログイン" : "Log in",
      signupFailed: isJa ? "サインアップに失敗しました" : "Signup failed",
    }),
    [isJa]
  );

  // ==== サインアップ処理（修正版） ====
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (submitting) return;
      setSubmitting(true);
      // ① Firebase Auth でユーザー作成
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // ② users/{uid} を作成（オンボーディング前の最小情報）
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: "",
          bio: "",
          photoURL: user.photoURL ?? "",
          createdAt: serverTimestamp(),
          counts: { posts: 0 },
        },
        { merge: true }
      );

      // ③ オンボーディングへ遷移
      const onboardingPath =
        variant === "mobile" ? "/mobile/onboarding" : "/web/onboarding";
      router.replace(onboardingPath);
    } catch (e: any) {
      console.error("サインアップ失敗:", e);
      alert(e?.message ?? ui.signupFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const formWidth = variant === "mobile" ? 320 : 360;

  return (
    <form onSubmit={handleSignup}>
      <div
        style={{
          width: "100%",
          maxWidth: formWidth,
          padding: variant === "mobile" ? 20 : 24,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 12,
          textAlign: "center",
          boxShadow: "0 0 30px rgba(0,0,0,0.3)",
        }}
      >
        <h1 style={{ fontWeight: "bold", fontSize: "1.7rem" }}>{ui.title}</h1>

        {/* Email */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <input
            type="email"
            placeholder={ui.emailPlaceholder}
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
            placeholder={ui.passwordPlaceholder}
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

          {showPassword ? (
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

        {/* === Gradient Button === */}
        <button
          disabled={submitting}
          type="submit"
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
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
              "linear-gradient(90deg, #7C3AED 0%, #EC4899 50%, #06B6D4 100%)",
            boxShadow:
              "0 10px 30px rgba(124,58,237,0.25), 0 12px 34px rgba(6,182,212,0.22)",
            transform: pressed ? "scale(0.97)" : "scale(1)",
            opacity: submitting ? 0.65 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          <span>{submitting ? (isJa ? "作成中..." : "Creating...") : ui.signupCta}</span>
          <span style={{ fontSize: 18 }}>↗</span>
        </button>

        <p style={{ marginTop: 20, fontSize: "0.85rem" }}>
          {ui.alreadyText}{" "}
          <Link
            href={variant === "mobile" ? "/mobile/login" : "/web/login"}
            style={{
              color: "#7DD3FC",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            {ui.loginText}
          </Link>
        </p>
      </div>
    </form>
  );
}
