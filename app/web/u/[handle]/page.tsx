"use client";

import { Suspense, useMemo } from "react";
import { useParams } from "next/navigation";
import ProfilePageBase from "@/app/component/profile/ProfilePageBaseV2";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";

function ProfilePageSkeleton() {
  return (
    <div className="flex justify-center px-4 py-8">
      <CandleChartLoader />
    </div>
  );
}

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

  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageBase handle={handle} variant="web" />
    </Suspense>
  );
}
