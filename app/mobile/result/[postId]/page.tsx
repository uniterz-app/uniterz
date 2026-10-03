import type { Metadata } from "next";
import { loadResultShareMeta } from "@/lib/share/server/loadShareMeta";
import { safeDecodeRouteParam } from "@/lib/share/shareGuestPaths";
import { resultShareMetadataText } from "@/lib/share/shareLandingCopy";
import { buildShareMetadata } from "@/lib/share/shareMetadata";
import ResultPostPageClient from "./ResultPostPageClient";

type Params = { params: Promise<{ postId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { postId } = await params;
  const meta = await loadResultShareMeta(safeDecodeRouteParam(postId));
  return buildShareMetadata({
    ...resultShareMetadataText(meta),
    path: `/mobile/result/${postId}`,
  });
}

export default async function MobileResultPostPage({ params }: Params) {
  const { postId: raw } = await params;
  const postId = safeDecodeRouteParam(raw);
  const shareMeta = await loadResultShareMeta(postId);
  return <ResultPostPageClient postId={postId} shareMeta={shareMeta} />;
}
