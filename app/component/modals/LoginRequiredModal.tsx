// app/component/modals/LoginRequiredModal.tsx
"use client";

import { useRouter } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

type Variant = "mobile" | "web";

type Props = {
  open: boolean;
  onClose: () => void;
  variant: Variant;
};

export default function LoginRequiredModal({
  open,
  onClose,
  variant,
}: Props) {
  const router = useRouter();
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isEn = language === "en";

  if (!open) return null;

  const signupHref =
    variant === "web" ? "/web/signup" : "/mobile/signup";

  return (
    <div className="fixed inset-0 z-1000">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b0b0f] p-6 text-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold text-center">
            この機能にはログインが必要です
          </h2>

          <p className="mt-2 text-sm text-white/70 text-center">
            アカウントを作成するとすべての機能を利用できます
          </p>

          <div className="mt-6 flex gap-3">
            {/* 戻る */}
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/20 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              {isEn ? "Back" : "戻る"}
            </button>

            {/* アカウント作成 */}
            <button
              onClick={() => router.push(signupHref)}
              className="flex-1 rounded-xl bg-linear-to-r from-orange-400 to-orange-500 py-2 text-sm font-bold text-black hover:opacity-90"
            >
              {isEn ? "Create account" : "アカウント作成"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
