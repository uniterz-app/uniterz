"use client";

import { useRouter } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import NbaAskChat from "@/app/component/ask/NbaAskChat";
import { nbaAskCopy } from "@/lib/nba/ask/nbaAskCopy";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

/** Games ヘッダー右上 — NBA スタッツを AI に質問 */
export default function MobileNbaAskPage() {
  const router = useRouter();
  const { fUser } = useFirebaseUser();
  const { language, timeZone } = useUserLanguage(fUser?.uid ?? null);
  const copy = nbaAskCopy(language);
  return (
    <MobilePageShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      onClose={() => router.back()}
      headerTransparent
      underlay={
        <>
          <div className="absolute inset-0 bg-[#07090e]" />
          <div className="absolute inset-x-0 top-0 h-[560px] bg-[linear-gradient(180deg,rgba(0,245,255,0.18)_0%,rgba(0,245,255,0.18)_22%,transparent_100%)]" />
        </>
      }
    >
      <NbaAskChat
        language={String(language ?? "ja")}
        timeZone={timeZone}
        signedIn={Boolean(fUser)}
      />
    </MobilePageShell>
  );
}
