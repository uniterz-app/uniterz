// app/web/settings/password/page.tsx
"use client";

import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import ChangePasswordForm from "@/app/component/auth/ChangePasswordForm";

export default function WebPasswordSettingsPage() {
  return (
    <AuthBackdrop accent="blueMagenta">
      <ChangePasswordForm variant="web" />
    </AuthBackdrop>
  );
}
