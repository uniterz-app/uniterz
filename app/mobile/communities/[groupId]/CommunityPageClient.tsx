"use client";

import CommunityDetailClient from "@/app/component/communities/CommunityDetailClient";
import ShareLandingView from "@/app/component/share/ShareLandingView";
import type { CommunityShareMeta } from "@/lib/share/shareMetaTypes";
import { useShareLandingMode } from "@/lib/share/useShareLandingMode";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

export default function CommunityPageClient({
  groupId,
  shareMeta,
}: {
  groupId: string;
  shareMeta: CommunityShareMeta | null;
}) {
  const landing = useShareLandingMode();
  const { status } = useFirebaseUser();

  if (landing) {
    return (
      <ShareLandingView
        target={{ kind: "community", meta: shareMeta }}
        path={`/mobile/communities/${encodeURIComponent(groupId)}`}
        signedIn={status === "ready"}
      />
    );
  }

  return <CommunityDetailClient variant="mobile" groupId={groupId} />;
}
