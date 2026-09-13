"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { auth } from "@/lib/firebase";
import { deleteMeAccount } from "@/lib/api/deleteMeAccount";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { deleteAccountCopy } from "@/lib/settings/deleteAccountCopy";

type Props = {
  platform: "mobile" | "web";
};

export default function DeleteAccountPage({ platform }: Props) {
  const router = useRouter();
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const labels = deleteAccountCopy(language);

  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPasswordUser = useMemo(
    () =>
      Boolean(
        fUser?.providerData.some((p) => p.providerId === "password")
      ),
    [fUser]
  );

  async function handleDelete() {
    const user = auth.currentUser;
    if (!user) return;
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      setError(labels.needDelete);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (isPasswordUser) {
        if (!password || !user.email) {
          throw new Error(labels.needPassword);
        }
        const cred = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, cred);
      }
      await deleteMeAccount();
      try {
        await signOut(auth);
      } catch {
        // Auth 削除済み
      }
      router.replace(platform === "web" ? "/web/login" : "/mobile/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.fail);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProfileCyberPage
      title="DELETE"
      subtitle={labels.desc}
      contentClassName={
        platform === "web"
          ? "flex max-w-2xl flex-col justify-center px-6 py-8 min-h-[min(70dvh,640px)]"
          : "flex max-w-[420px] flex-col justify-center px-4 py-6 min-h-[min(70dvh,560px)]"
      }
    >
      <div className="mx-auto w-full max-w-md border border-white/20 bg-black px-5 py-6 text-center">
        <h2 className="text-base font-extrabold tracking-wide text-white">
          {labels.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          {labels.desc}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">
          {labels.proNote}
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {isPasswordUser ? (
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-white/55">
              {labels.password}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="border border-white/20 bg-black px-3 py-2.5 text-center text-sm text-white outline-none focus:border-white/45"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-white/55">
            {labels.typeDelete}
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={busy}
              placeholder={labels.placeholder}
              autoCapitalize="characters"
              className="border border-white/20 bg-black px-3 py-2.5 text-center text-sm text-white outline-none focus:border-white/45"
            />
          </label>

          {error ? (
            <p className="text-center text-xs text-white/80">{error}</p>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDelete()}
            className="border border-rose-400/55 bg-rose-500/15 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-500/25 disabled:opacity-50"
          >
            {busy ? labels.submitting : labels.submit}
          </button>
        </div>
      </div>
    </ProfileCyberPage>
  );
}
