import { Suspense } from "react";
import RedemptionApplyPage from "@/app/component/redemption/RedemptionApplyPage";

export default function MobileRedeemApplyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white/40 text-sm">Loading…</div>}>
      <RedemptionApplyPage />
    </Suspense>
  );
}
