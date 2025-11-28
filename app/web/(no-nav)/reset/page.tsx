// app/web/reset/page.tsx みたいな場所想定
"use client";

import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import ResetForm from "@/app/component/auth/ResetForm";

export default function WebResetPage() {
  return (
    <AuthBackdrop accent="blueMagenta">
      <ResetForm variant="web" />
    </AuthBackdrop>
  );
}
