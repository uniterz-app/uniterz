"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";

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
    title: "Login",
    emailPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    loginCta: "LOG IN",
    forgotText: osIsJa ? "パスワードをお忘れの方は" : "Forgot your password?",
    hereText: osIsJa ? "こちら" : "Reset it",
    signupPrefix: "",
    signupCta: "Create Account",
    backToLp: "Back to LP",
  };

  const formWidth = v === "mobile" ? 286 : 420;
  const isMobile = v === "mobile";
  const titleSize = isMobile ? "1.62rem" : "2.2rem";
  const inputTextSize = isMobile ? "0.9rem" : "1rem";
  const buttonTextSize = isMobile ? "1.08rem" : "1.22rem";
  const helperTextSize = isMobile ? "0.74rem" : "0.9rem";
  const teamFontStyle = bracketMarketTeamTypography(isMobile);

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
          padding: isMobile ? 18 : 24,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 12,
          textAlign: "center",
          boxShadow: "0 0 30px rgba(0,0,0,0.3)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: isMobile ? 10 : 14 }}>
          <div
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              letterSpacing: isMobile ? "0.26em" : "0.32em",
              fontSize: isMobile ? "1.2rem" : "1.45rem",
              color: "rgba(255,237,213,0.9)",
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            UNITERZ
          </div>
          <div style={{ position: "relative", width: "100%" }}>
            <div
              style={{
                position: "relative",
                zIndex: 1,
                height: 2,
                width: "100%",
                overflow: "hidden",
                borderRadius: 9999,
              }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-95" />
              <div
                className="animate-header-cyber-sweep pointer-events-none absolute inset-y-0 left-0 w-[42%] max-w-[220px] opacity-90 will-change-transform"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 35%, rgba(224,255,255,0.95) 50%, rgba(255,255,255,0.35) 65%, transparent 100%)",
                }}
                aria-hidden
              />
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[2px] bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-70 blur-sm"
              aria-hidden
            />
          </div>
        </div>

        <h1
          style={{
            ...teamFontStyle,
            fontWeight: "bold",
            fontSize: titleSize,
            letterSpacing: isMobile ? "0.08em" : "0.06em",
          }}
        >
          {ui.title}
        </h1>

        {/* Email */}
        <div style={{ position: "relative", marginTop: isMobile ? 14 : 18 }}>
          <input
            type="email"
            placeholder={ui.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: isMobile ? "10px 36px 10px 11px" : "12px 40px 12px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
              fontSize: inputTextSize,
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
        <div style={{ position: "relative", marginTop: isMobile ? 9 : 12 }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder={ui.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: isMobile ? "10px 36px 10px 11px" : "12px 40px 12px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
              fontSize: inputTextSize,
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
            width: "100%",
            padding: isMobile ? "10px 12px" : "12px 14px",
            marginTop: isMobile ? 14 : 18,
            border: "none",
            borderRadius: 14,
            color: "white",
            fontWeight: 700,
            letterSpacing: 0.4,
            background:
              "linear-gradient(90deg, #0E7490 0%, #9D174D 50%, #4C1D95 100%)",
            boxShadow:
              "0 10px 30px rgba(14,116,144,0.22), 0 12px 34px rgba(76,29,149,0.2)",
            transition: "transform .06s ease, filter .15s ease, box-shadow .15s ease",
            transform: pressed ? "scale(0.97)" : "scale(1)",
            opacity: submitting ? 0.65 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          <span
            style={{
              ...teamFontStyle,
              letterSpacing: isMobile ? "0.08em" : "0.06em",
              textTransform: "uppercase",
              fontSize: buttonTextSize,
            }}
          >
            {submitting
              ? "LOGGING IN..."
              : ui.loginCta}
          </span>
        </button>

        {/* Reset */}
        <p style={{ marginTop: isMobile ? 11 : 14, fontSize: helperTextSize, opacity: 0.9 }}>
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
        <p style={{ marginTop: isMobile ? 8 : 10, fontSize: helperTextSize }}>
          {ui.signupPrefix}
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

        <p style={{ marginTop: isMobile ? 10 : 12, fontSize: helperTextSize }}>
          <Link
            href={v === "mobile" ? "/mobile/lp" : "/lp"}
            style={{
              color: "rgba(255,255,255,0.72)",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            }}
          >
            {ui.backToLp}
          </Link>
        </p>
      </div>
    </form>
  );
}