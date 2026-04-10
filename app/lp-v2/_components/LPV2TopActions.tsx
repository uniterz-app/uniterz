"use client";

import Link from "next/link";

type LPV2TopActionsProps = {
  mobile?: boolean;
};

export default function LPV2TopActions({ mobile = false }: LPV2TopActionsProps) {
  const loginHref = mobile ? "/mobile/login" : "/web/login";
  const signupHref = mobile ? "/mobile/signup" : "/web/signup";

  return (
    <div className="pointer-events-auto absolute right-5 top-6 z-20 flex items-center gap-2 sm:right-8 sm:top-8">
      <Link
        href={loginHref}
        className={`inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 font-semibold text-white/88 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.35)] animate-[lpv2-btn-fade-up_.42s_cubic-bezier(.2,.8,.2,1)_both] ${
          mobile ? "h-9 px-3 text-[12px]" : "h-10 px-4 text-[13px]"
        }`}
      >
        Login
      </Link>
      <Link
        href={signupHref}
        className={`inline-flex items-center justify-center rounded-xl border border-cyan-200/30 bg-white font-bold text-[#05070b] shadow-[0_8px_26px_rgba(255,255,255,0.18)] animate-[lpv2-btn-fade-up_.52s_cubic-bezier(.2,.8,.2,1)_.08s_both] ${
          mobile ? "h-9 px-3 text-[12px]" : "h-10 px-4 text-[13px]"
        }`}
      >
        Sign up
      </Link>
      <style>{`
        @keyframes lpv2-btn-fade-up {
          0% {
            opacity: 0;
            transform: translate3d(0, 12px, 0) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

