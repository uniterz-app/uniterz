import {
  renderGenericShareOgImage,
  SHARE_OG_CONTENT_TYPE,
  SHARE_OG_SIZE,
} from "@/lib/share/server/shareOgImage";

export const size = SHARE_OG_SIZE;
export const contentType = SHARE_OG_CONTENT_TYPE;
export const alt = "UNITERZ";

export default async function Image() {
  return renderGenericShareOgImage();
}
