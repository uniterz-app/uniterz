"use client";

import { useParams } from "next/navigation";
import CommunityDetailClient from "@/app/component/communities/CommunityDetailClient";

export default function MobileCommunityDetailPage() {
  const p = useParams();
  const groupId = String(p?.groupId ?? "");
  return <CommunityDetailClient variant="mobile" groupId={groupId} />;
}
