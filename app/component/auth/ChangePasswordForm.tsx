"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import CyberAuthField from "@/app/component/auth/CyberAuthField";

type Props = {
  variant?: "web" | "mobile";
};

export default function ChangePasswordForm({ variant = "web" }: Props) {
  const router = useRouter();
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [nextConfirm, setNextConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        alert(m.auth.loginRequired);
        return;
      }

      if (!current || !next) {
        alert(m.settings.currentPassword);
        return;
      }

      if (next !== nextConfirm) {
        alert(m.settings.passwordsNoMatch);
        return;
      }

      setLoading(true);

      const cred = EmailAuthProvider.credential(
        auth.currentUser.email,
        current
      );
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, next);

      alert(m.settings.passwordUpdated);
      setCurrent("");
      setNext("");
      setNextConfirm("");
      router.back();
    } catch (err: unknown) {
      console.error("change password error:", err);
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: unknown }).code)
          : "";
      if (code === "auth/wrong-password") {
        alert(m.settings.currentPasswordWrong);
      } else if (code === "auth/weak-password") {
        alert(m.settings.passwordChangeFailed);
      } else {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : "";
        alert(message || m.settings.passwordChangeFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  const lockSlot = (
    <span className="flex items-center justify-center text-[15px] text-white/80">
      <Lock className="h-4 w-4" aria-hidden />
    </span>
  );

  return (
    <ProfileCyberPage
      title="PASSWORD"
      subtitle={m.settings.changePasswordDesc}
      contentClassName={
        variant === "web" ? "max-w-2xl px-6 py-8" : "max-w-lg px-4 py-5"
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/75">
            {m.settings.currentPassword}
          </label>
          <CyberAuthField
            angular
            inputProps={{
              type: "password",
              autoComplete: "current-password",
              placeholder: m.settings.currentPassword,
              value: current,
              onChange: (e) => setCurrent(e.target.value),
            }}
            rightSlot={lockSlot}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/75">
            {m.settings.newPassword}
          </label>
          <CyberAuthField
            angular
            inputProps={{
              type: "password",
              autoComplete: "new-password",
              placeholder: m.settings.newPassword,
              value: next,
              onChange: (e) => setNext(e.target.value),
            }}
            rightSlot={lockSlot}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/75">
            {m.settings.confirmNewPassword}
          </label>
          <CyberAuthField
            angular
            inputProps={{
              type: "password",
              autoComplete: "new-password",
              placeholder: m.settings.confirmNewPassword,
              value: nextConfirm,
              onChange: (e) => setNextConfirm(e.target.value),
            }}
            rightSlot={lockSlot}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={[
            "predict-overlay-submit-btn mt-1 flex w-full items-center justify-center px-3.5 py-3 text-sm font-bold tracking-wide",
            loading
              ? "predict-overlay-submit-btn--disabled cursor-not-allowed"
              : "cursor-pointer",
          ].join(" ")}
        >
          {loading ? m.common.saving : m.settings.changePassword}
        </button>
      </form>
    </ProfileCyberPage>
  );
}
