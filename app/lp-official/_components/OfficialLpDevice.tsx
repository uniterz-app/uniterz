import type { ReactNode } from "react";
import type { OfficialAssetBrief } from "@/lib/lp/officialSiteContent";
import OfficialLpAssetSlot from "./OfficialLpAssetSlot";

export default function OfficialLpDevice({
  label,
  brief,
  children,
}: {
  label: string;
  brief: OfficialAssetBrief;
  children: ReactNode;
}) {
  return (
    <figure className="m-0 w-full max-w-[280px]">
      <div className="olp-device">
        <div className="olp-device-screen">
          <div className="olp-device-notch" aria-hidden />
          {children}
        </div>
      </div>
      <figcaption className="olp-metric mt-3 text-center text-[12px] font-semibold tracking-[0.12em] text-[#c5d0e4]">
        {label}
      </figcaption>
      <div className="mt-3">
        <OfficialLpAssetSlot brief={brief} />
      </div>
    </figure>
  );
}
