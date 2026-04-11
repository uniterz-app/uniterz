"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import CyberAuthField from "./CyberAuthField";
import cyberFieldStyles from "./cyberAuthField.module.css";

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
      showPw: isJa ? "パスワードを表示" : "Show password",
      hidePw: isJa ? "パスワードを隠す" : "Hide password",
    }),
    [isJa]
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
        className="relative isolate mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/55 px-6 py-7 text-center shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
        style={{ width: formWidth, maxWidth: "100%" }}
      >
        <div className={cyberFieldStyles.pageGrid} aria-hidden />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-[1.75rem]">
            {ui.title}
          </h1>

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
              "mt-5 flex w-full items-center justify-center gap-2.5 rounded-[14px] border-0 px-3.5 py-3 font-bold tracking-wide text-white",
              "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-violet-600",
              "shadow-[0_10px_30px_rgba(6,182,212,0.25),0_12px_34px_rgba(124,58,237,0.22)]",
              "transition-[transform,filter,opacity] duration-100 ease-out",
              pressed ? "scale-[0.97]" : "scale-100",
              submitting ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
          >
            <span>
              {submitting
                ? isJa
                  ? "作成中..."
                  : "Creating..."
                : ui.signupCta}
            </span>
            <span className="text-lg leading-none">↗</span>
          </button>

          <p className="mt-5 text-sm text-white/85">
            {ui.alreadyText}{" "}
            <Link
              href={variant === "mobile" ? "/mobile/login" : "/web/login"}
              className="font-bold text-sky-300 underline decoration-sky-400/60 underline-offset-2 hover:text-sky-200"
            >
              {ui.loginText}
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
