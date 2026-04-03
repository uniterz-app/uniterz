"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import ProfilePageBase from "@/app/component/profile/ProfilePageBaseV2";

export default function Page() {
  const params = useParams<{ handle: string }>();
  const handle = useMemo(() => {
    const raw =
      typeof params?.handle === "string"
        ? params.handle
        : Array.isArray(params?.handle)
          ? params.handle[0]
          : "";
    return decodeURIComponent(raw);
  }, [params]);

  return <ProfilePageBase handle={handle} variant="web" />;
}
