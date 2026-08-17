import Image from "next/image";
import { UNITERZ_LOGO_ASSET } from "@/lib/units/uniterzLogoAsset";

type OfficialLpLogoProps = {
  className?: string;
  priority?: boolean;
  title?: string;
  centered?: boolean;
};

/** 確定版 UNITERZ ワードマーク */
export default function OfficialLpLogo({
  className,
  priority = false,
  title = "Uniterz",
  centered = false,
}: OfficialLpLogoProps) {
  return (
    <span className={className} role="img" aria-label={title}>
      <Image
        src={`${UNITERZ_LOGO_ASSET.webPath}?v=vector-fill-2026-08`}
        alt={title}
        width={UNITERZ_LOGO_ASSET.width}
        height={UNITERZ_LOGO_ASSET.height}
        priority={priority}
        unoptimized
        className={`h-auto w-full object-contain ${centered ? "object-center" : "object-left"}`}
      />
    </span>
  );
}
