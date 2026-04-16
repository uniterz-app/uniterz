"use client";

import { useState } from "react";
import Link from "next/link";
import { FaEnvelope } from "react-icons/fa";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import CyberAuthField from "./CyberAuthField";
import AuthFormBranding from "./AuthFormBranding";
import cyberFieldStyles from "./cyberAuthField.module.css";
import { authDisplayHeadingLong, authDisplayButton } from "./authEnglishDisplay";

type Props = {
  variant?: "web" | "mobile";
};

export default function ResetForm({ variant = "web" }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const formWidth = variant === "mobile" ? 320 : 380;

  const bodySans =
    "font-[family-name:var(--font-geist-sans)] text-sm leading-relaxed text-white/85";

  const ui = {
    title: "RESET PASSWORD",
    lead: "登録したメールアドレスにリセット用のリンクをお送りします。",
    leadNote: "＊迷惑フォルダもご確認ください。",
    emailPlaceholder: "Email Address",
    sendCta: "SEND RESET LINK",
    sending: "Sending…",
    backLead: "Back to ",
    loginLink: "Log in",
    enterEmail: "Please enter your email address.",
    success:
      "If this email is registered, we sent a reset link. Check spam if you don't see it.",
    timeout:
      "Request timed out. In DevTools → Network, check identitytoolkit / sendOobCode.",
    tooMany: "Too many attempts. Please try again later.",
    network: "Network error. Check your connection.",
    failed: "Failed to send. Please try again in a moment.",
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (busy) return;

    const trimmed = email.trim();
    setMsg(null);
    setErr(null);

    if (!trimmed) {
      setErr(ui.enterEmail);
      return;
    }

    try {
      setBusy(true);

      await Promise.race([
        sendPasswordResetEmail(auth, trimmed),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000)
        ),
      ]);

      setMsg(ui.success);
    } catch (e: any) {
      const code = e?.code as string | undefined;

      if (e?.message === "timeout") {
        setErr(ui.timeout);
      } else if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        setMsg(ui.success);
      } else if (code === "auth/too-many-requests") {
        setErr(ui.tooMany);
      } else if (code === "auth/network-request-failed") {
        setErr(ui.network);
      } else {
        setErr(ui.failed);
      }

      console.error("[reset] sendPasswordResetEmail error:", code, e);
    } finally {
      setBusy(false);
    }
  }

  const loginHref = variant === "mobile" ? "/mobile/login" : "/web/login";

  return (
    <form onSubmit={onSubmit}>
      <div
        className="relative isolate mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/55 px-6 pb-7 pt-4 text-center shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:pt-5"
        style={{ width: formWidth, maxWidth: "100%" }}
      >
        <div className={cyberFieldStyles.pageGrid} aria-hidden />
        <div className="relative z-10">
          <AuthFormBranding />
          <h1 className={`mt-1 ${authDisplayHeadingLong}`}>{ui.title}</h1>

          <div className={`mt-3 space-y-2 ${bodySans}`}>
            <p>{ui.lead}</p>
            <p className="text-white/75">{ui.leadNote}</p>
          </div>

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
                disabled: busy,
              }}
              rightSlot={
                <span className="flex items-center justify-center text-[15px] text-white/85">
                  <FaEnvelope aria-hidden />
                </span>
              }
          />
        </div>

        <button
          type="submit"
          disabled={busy}
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
              busy ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
          >
            {busy ? ui.sending : ui.sendCta}
        </button>

        {msg && (
            <p className={`mt-4 ${bodySans} text-emerald-300/95`}>{msg}</p>
          )}
          {err && <p className={`mt-4 ${bodySans} text-red-300/95`}>{err}</p>}

          <p className={`mt-5 ${bodySans}`}>
            {ui.backLead}
            <Link
              href={loginHref}
              className="font-semibold text-sky-300 underline decoration-sky-400/60 underline-offset-2 hover:text-sky-200"
            >
              {ui.loginLink}
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
