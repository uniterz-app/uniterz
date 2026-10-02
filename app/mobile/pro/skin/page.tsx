import { Suspense } from "react";
import ProSkinPage from "@/app/component/profile/pro/ProSkinPage";

export default function MobileProSkinRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#03080d]" />}>
      <ProSkinPage platform="mobile" />
    </Suspense>
  );
}
