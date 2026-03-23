// app/mobile/(no-nav)/reset/page.tsx （例）
"use client";

import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import ResetForm from "@/app/component/auth/ResetForm";

export default function MobileResetPage() {
  return (
    <AuthBackdrop accent="blueMagenta">
      <ResetForm variant="mobile" />
    </AuthBackdrop>
  );
}
