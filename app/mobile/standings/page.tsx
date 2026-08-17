"use client";

import { useRouter } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import NbaStandingsPanel from "@/app/component/standings/NbaStandingsPanel";

export default function MobileStandingsPage() {
  const router = useRouter();

  return (
    <MobilePageShell
      eyebrow="GAMES"
      title="STANDINGS"
      onClose={() => router.back()}
    >
      <NbaStandingsPanel />
    </MobilePageShell>
  );
}
