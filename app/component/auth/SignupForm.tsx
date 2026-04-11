"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import CyberAuthField from "./CyberAuthField";
import AuthFormBranding from "./AuthFormBranding";
import cyberFieldStyles from "./cyberAuthField.module.css";
import { authDisplayHeadingLong, authDisplayButton } from "./authEnglishDisplay";

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
  const lpHref = variant === "mobile" ? "/mobile/lp" : "/lp";

  const bodySans =
    "font-[family-name:var(--font-geist-sans)] text-sm leading-relaxed text-white/85";

  const ui = useMemo(
    () => ({
      title: "CREATE ACCOUNT",
      emailPlaceholder: "Email Address",
      passwordPlaceholder: "Password",
      signupCta: "SIGN UP",
      alreadyLead: "すでにアカウントをお持ちの方は",
      loginText: "Login",
      backLp: "Back to LP",
      signupFailed: "Signup failed",
      showPw: "Show password",
      hidePw: "Hide password",
    }),
    []
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (submitting) return;
      setSubmitting(true);
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = cred.user;

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

  const formWidth = variant === "mobile" ? 320 : 380;

  return (
    <form onSubmit={handleSignup}>
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
                autoComplete: "new-password",
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

          <button
            type="submit"
            disabled={submitting}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            className={[
              "mt-5 flex w-full items-center justify-center rounded-[14px] border-0 px-3.5 py-3",
              authDisplayButton,
              "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-violet-600",
              "shadow-[0_10px_30px_rgba(6,182,212,0.25),0_12px_34px_rgba(124,58,237,0.22)]",
              "transition-[transform,filter,opacity] duration-100 ease-out",
              pressed ? "scale-[0.97]" : "scale-100",
              submitting ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
          >
            {submitting ? "Creating…" : ui.signupCta}
          </button>

          <p className={`mt-5 ${bodySans}`}>
            {ui.alreadyLead}{" "}
            <Link
              href={variant === "mobile" ? "/mobile/login" : "/web/login"}
              className="font-semibold text-sky-300 underline decoration-sky-400/60 underline-offset-2 hover:text-sky-200"
            >
              {ui.loginText}
            </Link>
          </p>

          <p className="mt-4">
            <Link
              href={lpHref}
              className="font-[family-name:var(--font-geist-sans)] text-xs text-white/70 underline decoration-white/35 underline-offset-2 hover:text-white/90"
            >
              {ui.backLp}
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
