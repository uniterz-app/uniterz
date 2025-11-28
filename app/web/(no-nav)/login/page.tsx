"use client";

import LoginForm from "@/app/component/auth/LoginForm";
import AuthBackdrop from "@/app/component/auth/AuthBackdrop";

export default function WebLoginPage() {
  return (
    <AuthBackdrop>
      <LoginForm variant="web" />
    </AuthBackdrop>
  );
}

