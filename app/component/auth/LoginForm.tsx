"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

type LoginFormProps = {
  variant?: "web" | "mobile"; // 渡されても良いし、未指定なら pathname で判定
};

export default function LoginForm({ variant }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pressed, setPressed] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // variant 未指定ならURLから自動判定
  const v: "web" | "mobile" = useMemo(() => {
    if (variant) return variant;
    if (pathname?.startsWith("/mobile")) return "mobile";
    return "web";
  }, [variant, pathname]);

  const osIsJa =
    typeof navigator !== "undefined" &&
    navigator.language?.toLowerCase().startsWith("ja");

  const ui = {
    title: osIsJa ? "ログイン" : "Login",
    emailPlaceholder: osIsJa ? "メールアドレス" : "Email Address",
    passwordPlaceholder: osIsJa ? "パスワード" : "Password",
    loginCta: osIsJa ? "ログイン" : "LOG IN",
    forgotText: osIsJa ? "パスワードをお忘れの方は" : "Forgot your password?",
    hereText: osIsJa ? "こちら" : "Reset it",
    signupPrefix: osIsJa ? "アカウントを" : "Create an account",
    signupCta: osIsJa ? "新規作成" : "Sign Up",
  };

  const formWidth = v === "mobile" ? 320 : 360;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (submitting) return;
      setSubmitting(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      const d = (await getUserDocDataCached(user.uid)) as any;

      const handle = d?.handle || d?.username;
      const hasLanguage = d?.language === "ja" || d?.language === "en";

      // 遷移先を v で確実に分岐
      const base = v === "mobile" ? "/mobile/u" : "/web/u";
      const onboardingPath =
        v === "mobile" ? "/mobile/onboarding" : "/web/onboarding";

      if (handle && hasLanguage) {
        router.replace(`${base}/${encodeURIComponent(handle)}`);
      } else if (!hasLanguage) {
        router.replace(onboardingPath);
      } else {
        // handle 無い場合の保険（必要なら好きに）
        router.replace(onboardingPath);
      }
    } catch (error: any) {
      console.error("ログイン失敗:", error);
      alert(error?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 style={{ fontWeight: "bold", fontSize: "1.7rem" }}>{ui.title}</h1>

        {/* Email */}
        <div style={{ position: "relative", marginTop: 16 }}>
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

        <button
          type="submit"
          disabled={submitting}
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
              "linear-gradient(90deg, #06B6D4 0%, #EC4899 50%, #7C3AED 100%)",
            boxShadow:
              "0 10px 30px rgba(6,182,212,0.25), 0 12px 34px rgba(124,58,237,0.22)",
            transition: "transform .06s ease, filter .15s ease, box-shadow .15s ease",
            transform: pressed ? "scale(0.97)" : "scale(1)",
            opacity: submitting ? 0.65 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          <span>
            {submitting
              ? osIsJa
                ? "ログイン中..."
                : "Logging in..."
              : ui.loginCta}
          </span>
          <span style={{ fontSize: 18, lineHeight: 1 }}>↗</span>
        </button>

        {/* Reset */}
        <p style={{ marginTop: 12, fontSize: "0.85rem", opacity: 0.9 }}>
          {ui.forgotText}{" "}
          <Link
            href={v === "mobile" ? "/mobile/reset" : "/web/reset"}
            style={{
              color: "#7DD3FC",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            {ui.hereText}
          </Link>
        </p>

        {/* Signup */}
        <p style={{ marginTop: 10 }}>
          {ui.signupPrefix}{" "}
          <Link
            href={v === "mobile" ? "/mobile/signup" : "/web/signup"}
            style={{
              color: "#7DD3FC",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            {ui.signupCta}
          </Link>
        </p>
      </div>
    </form>
  );
}