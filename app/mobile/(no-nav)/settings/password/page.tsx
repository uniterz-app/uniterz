// app/mobile/(no-nav)/settings/password/page.tsx
"use client";

import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import ChangePasswordForm from "@/app/component/auth/ChangePasswordForm";

export default function MobilePasswordSettingsPage() {
  return (
    <AuthBackdrop accent="tealBlue">
      <ChangePasswordForm variant="mobile" />
    </AuthBackdrop>
  );
}
