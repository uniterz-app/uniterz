import { loadCommunityShareMeta } from "@/lib/share/server/loadShareMeta";
import { safeDecodeRouteParam } from "@/lib/share/shareGuestPaths";
import {
  renderCommunityShareOgImage,
  SHARE_OG_CONTENT_TYPE,
  SHARE_OG_SIZE,
} from "@/lib/share/server/shareOgImage";

export const size = SHARE_OG_SIZE;
export const contentType = SHARE_OG_CONTENT_TYPE;
export const alt = "UNITERZ";

export default async function Image({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return renderCommunityShareOgImage(await loadCommunityShareMeta(safeDecodeRouteParam(groupId)));
}
