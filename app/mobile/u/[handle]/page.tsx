import type { Metadata } from "next";
import { loadProfileShareMeta } from "@/lib/share/server/loadShareMeta";
import { safeDecodeRouteParam } from "@/lib/share/shareGuestPaths";
import { profileShareMetadataText } from "@/lib/share/shareLandingCopy";
import { buildShareMetadata } from "@/lib/share/shareMetadata";
import ProfilePageClient from "./ProfilePageClient";

type Params = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const meta = await loadProfileShareMeta(safeDecodeRouteParam(handle));
  return buildShareMetadata({
    ...profileShareMetadataText(meta),
    path: `/mobile/u/${handle}`,
  });
}

export default async function Page({ params }: Params) {
  const { handle: raw } = await params;
  const handle = safeDecodeRouteParam(raw);
  const shareMeta = await loadProfileShareMeta(handle);
  return <ProfilePageClient handle={handle} shareMeta={shareMeta} />;
}
