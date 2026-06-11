"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import { normalizeLanguage } from "@/lib/i18n/language";
import CyberAuthField from "./CyberAuthField";
import AuthFormBranding from "./AuthFormBranding";
import cyberFieldStyles from "./cyberAuthField.module.css";
import { authDisplayHeadingLong, authDisplayButton } from "./authEnglishDisplay";
import { mapAuthErrorMessage } from "@/lib/auth/mapAuthErrorMessage";
import {
  sanitizeInternalNext,
  stashPostOnboardingRedirect,
} from "@/lib/auth/safeNextRedirect";

type LoginFormProps = {
  variant?: "web" | "mobile";
};

export default function LoginForm({ variant }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const v: "web" | "mobile" = useMemo(() => {
    if (variant) return variant;
    if (pathname?.startsWith("/mobile")) return "mobile";
    return "web";
  }, [variant, pathname]);

  const signupBase = v === "mobile" ? "/mobile/signup" : "/web/signup";
  const [signupHref, setSignupHref] = useState(signupBase);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const safe = sanitizeInternalNext(sp.get("next"));
    setSignupHref(safe ? `${signupBase}?next=${encodeURIComponent(safe)}` : signupBase);
  }, [signupBase]);

  /** 見出し・主ボタン＝Bebas 系コンデンス（バナー英字）／補助文・日本語＝Geist */
  const bodySans =
    "font-[family-name:var(--font-geist-sans)] text-sm leading-relaxed text-white/85";

  const ui = {
    title: "LOGIN",
    emailPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    loginCta: "LOG IN",
    forgotLead: "パスワードをお忘れの方は",
    forgotLink: "こちら",
    createAccount: "Create Account",
    showPw: "Show password",
    hidePw: "Hide password",
  };

  const formWidth = v === "mobile" ? 320 : 380;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (submitting) return;
      setFormError(null);
      setSubmitting(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      const d = (await getUserDocDataCached(user.uid)) as any;

      const handle = d?.handle || d?.username;
      const hasLanguage = normalizeLanguage(d?.language) !== null;

      const gamesPath = v === "mobile" ? "/mobile/games" : "/web/games";
      const onboardingPath =
        v === "mobile" ? "/mobile/onboarding" : "/web/onboarding";

      const sp = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      const next = sanitizeInternalNext(sp.get("next"));

      if (handle && hasLanguage) {
        if (next) {
          router.replace(next);
        } else {
          router.replace(gamesPath);
        }
      } else {
        stashPostOnboardingRedirect(sp.get("next"));
        router.replace(onboardingPath);
      }
    } catch (error: unknown) {
      // 想定内の認証失敗を console.error に出すと Next.js dev で赤いオーバーレイになる
      if (process.env.NODE_ENV === "development") {
        console.warn("[login]", error);
      }
      setFormError(mapAuthErrorMessage(error, "login"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div
        className="relative isolate mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/55 px-6 pb-7 pt-4 text-center shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:pt-5"
        style={{ width: formWidth, maxWidth: "100%" }}
      >
        <div className={cyberFieldStyles.pageGrid} aria-hidden />
        <div className="relative z-10">
        <AuthFormBranding />
        <h1 className={`mt-1 ${authDisplayHeadingLong}`}>{ui.title}</h1>

        <div className="mt-5 space-y-3 text-left">
          <CyberAuthField
            inputProps={{
              type: "email",
              name: "email",
              autoComplete: "email",
              placeholder: ui.emailPlaceholder,
              value: email,
              onChange: (e) => setEmail(e.target.value),
              required: true,
            }}
            rightSlot={
              <span className="flex items-center justify-center text-[15px] text-white/85">
                <FaEnvelope aria-hidden />
              </span>
            }
          />

          <CyberAuthField
            rightSlotAnimated
            inputProps={{
              type: showPassword ? "text" : "password",
              name: "password",
              autoComplete: "current-password",
              placeholder: ui.passwordPlaceholder,
              value: password,
              onChange: (e) => setPassword(e.target.value),
              required: true,
            }}
            rightSlot={
              <button
                type="button"
                className="flex size-full items-center justify-center text-[15px] text-white/90"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? ui.hidePw : ui.showPw}
              >
                {showPassword ? (
                  <FaEye aria-hidden />
                ) : (
                  <FaEyeSlash aria-hidden />
                )}
              </button>
            }
          />
        </div>

        {formError ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-400/35 bg-red-950/35 px-3 py-2.5 text-left text-sm leading-relaxed text-red-100/95"
          >
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          className={[
            "mt-5 flex w-full items-center justify-center rounded-[14px] border-0 px-3.5 py-3",
            authDisplayButton,
            "bg-linear-to-r from-cyan-500 via-fuchsia-500 to-violet-600",
            "shadow-[0_10px_30px_rgba(6,182,212,0.25),0_12px_34px_rgba(124,58,237,0.22)]",
            "transition-[transform,filter,opacity] duration-100 ease-out",
            pressed ? "scale-[0.97]" : "scale-100",
            submitting ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          ].join(" ")}
        >
          {submitting ? "Logging in…" : ui.loginCta}
        </button>

        <p className={`mt-4 ${bodySans}`}>
          {ui.forgotLead}
          <Link
            href={v === "mobile" ? "/mobile/reset" : "/web/reset"}
            className="font-semibold text-sky-300 underline decoration-sky-400/60 underline-offset-2 hover:text-sky-200"
          >
            {ui.forgotLink}
          </Link>
        </p>

        <p className="mt-3">
          <Link
            href={signupHref}
            className={`${bodySans} font-semibold text-sky-300 underline decoration-sky-400/60 underline-offset-2 hover:text-sky-200`}
          >
            {ui.createAccount}
          </Link>
        </p>
        </div>
      </div>
    </form>
  );
}
