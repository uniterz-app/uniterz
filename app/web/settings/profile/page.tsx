"use client";

import { useRouter } from "next/navigation";
import ProfileEditSheet from "@/app/component/profile/ProfileEditSheet";

export default function ProfileEditPage() {
  const router = useRouter();
  return <ProfileEditSheet onClose={() => router.back()} />;
}
