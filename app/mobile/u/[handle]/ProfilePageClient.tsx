"use client";

import { Suspense } from "react";
import ProfilePageBase from "@/app/component/profile/ProfilePageBaseV2";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ShareLandingView from "@/app/component/share/ShareLandingView";
import TutorialWelcomeProfileFlyShell from "@/app/component/tutorial/TutorialWelcomeProfileFlyShell";
import TutorialLiveHost from "@/app/component/tutorial/TutorialLiveHost";
import type { ProfileShareMeta } from "@/lib/share/shareMetaTypes";
import { useShareLandingMode } from "@/lib/share/useShareLandingMode";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

function ProfilePageSkeleton() {
  return (
    <div className="flex justify-center px-4 py-8">
      <CandleChartLoader />
    </div>
  );
}

export default function ProfilePageClient({
  handle,
  shareMeta,
}: {
  handle: string;
  shareMeta: ProfileShareMeta | null;
}) {
  const landing = useShareLandingMode();
  const { status } = useFirebaseUser();

  if (landing) {
    return (
      <ShareLandingView
        target={{ kind: "profile", meta: shareMeta }}
        path={`/mobile/u/${encodeURIComponent(handle)}`}
        signedIn={status === "ready"}
      />
    );
  }

  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <TutorialWelcomeProfileFlyShell>
        <ProfilePageBase handle={handle} variant="mobile" />
      </TutorialWelcomeProfileFlyShell>
      <TutorialLiveHost page="profile" />
    </Suspense>
  );
}
