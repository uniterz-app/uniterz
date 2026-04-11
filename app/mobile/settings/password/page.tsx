// app/mobile/(no-nav)/settings/password/page.tsx
"use client";

import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import ChangePasswordForm from "@/app/component/auth/ChangePasswordForm";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";

export default function MobilePasswordSettingsPage() {
  return (
    <AuthBackdrop accent="tealBlue">
      <FloatingCloseButton />
      <ChangePasswordForm variant="mobile" />
    </AuthBackdrop>
  );
}
