// app/web/settings/password/page.tsx
"use client";

import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import ChangePasswordForm from "@/app/component/auth/ChangePasswordForm";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";

export default function WebPasswordSettingsPage() {
  return (
    <AuthBackdrop accent="blueMagenta">
      <FloatingCloseButton />
      <ChangePasswordForm variant="web" />
    </AuthBackdrop>
  );
}
