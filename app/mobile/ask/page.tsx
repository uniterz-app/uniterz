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
    <MobilePageShell eyebrow={copy.eyebrow} title={copy.title} onClose={() => router.back()}>
      <NbaAskChat
        language={String(language ?? "ja")}
        timeZone={timeZone}
        signedIn={Boolean(fUser)}
      />
    </MobilePageShell>
  );
}
