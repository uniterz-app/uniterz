import type { Metadata } from "next";
import { loadCommunityShareMeta } from "@/lib/share/server/loadShareMeta";
import { safeDecodeRouteParam } from "@/lib/share/shareGuestPaths";
import { communityShareMetadataText } from "@/lib/share/shareLandingCopy";
import { buildShareMetadata } from "@/lib/share/shareMetadata";
import CommunityPageClient from "./CommunityPageClient";

type Params = { params: Promise<{ groupId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { groupId } = await params;
  const meta = await loadCommunityShareMeta(safeDecodeRouteParam(groupId));
  return buildShareMetadata({
    ...communityShareMetadataText(meta),
    path: `/mobile/communities/${groupId}`,
  });
}

export default async function MobileCommunityDetailPage({ params }: Params) {
  const { groupId: raw } = await params;
  const groupId = safeDecodeRouteParam(raw);
  const shareMeta = await loadCommunityShareMeta(groupId);
  return <CommunityPageClient groupId={groupId} shareMeta={shareMeta} />;
}
