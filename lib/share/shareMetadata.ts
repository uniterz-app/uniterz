/** 共有ページの Next Metadata（OGP / X カード / Smart App Banner） */
import type { Metadata } from "next";
import { getAppStoreAppId, getShareAppOrigin } from "@/lib/share/shareAppUrls";

export function buildShareMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${getShareAppOrigin()}${opts.path}`;
  const appId = getAppStoreAppId();
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "UNITERZ",
      type: "website",
      locale: "ja_JP",
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
    ...(appId ? { itunes: { appId, appArgument: url } } : {}),
  };
}
