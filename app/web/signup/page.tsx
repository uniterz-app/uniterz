"use client";

import SignupForm from "@/app/component/auth/SignupForm";
import AuthBackdrop from "@/app/component/auth/AuthBackdrop";

export default function WebSignupPage() {
  return (
    <AuthBackdrop>
      <SignupForm variant="web" />
    </AuthBackdrop>
  );
}
