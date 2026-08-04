"use client";

/**
 * /mobile/pro-skin-unlock-preview · /dev/pro-skin-unlock-preview
 * マイルストーン解放モーダルのデザイン確認用。
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProfileProSkinUnlockOverlay from "@/app/component/profile/pro/ProfileProSkinUnlockOverlay";
import { PRO_SKIN_UNLOCK_NOTICE_PREVIEW_IDS } from "@/lib/profile/proSkinUnlockNotice";
import {
  parseProSkinOwnerCounts,
  PRO_SKIN_OWNER_COUNTS_DOC_PATH,
} from "@/lib/profile/proSkinOwnerCountsClient";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";

export default function ProSkinUnlockPreviewPage() {
  const [open, setOpen] = useState(true);
  const [ownerCounts, setOwnerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const snap = await getDoc(doc(db, PRO_SKIN_OWNER_COUNTS_DOC_PATH));
        if (!alive) return;
        setOwnerCounts(
          snap.exists() ? parseProSkinOwnerCounts(snap.data()) : {}
        );
      } catch {
        if (!alive) return;
        setOwnerCounts({});
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#03080d] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[420px]">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-300/80",
          ].join(" ")}
        >
          Preview
        </p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold text-white",
          ].join(" ")}
        >
          Pro Skin Unlock Modal
        </h1>
        <p className="mt-2 text-sm text-white/50">
          解放モーダルのヒーローに実際のスキン模様（Circuit Lace）を1枚表示。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={[
              nameOxanium.className,
              "border-2 border-[#00F5FF] bg-[#00F5FF] px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#050508]",
            ].join(" ")}
          >
            Show modal
          </button>
          <Link
            href="/mobile/mypage?forceSkinUnlock=1"
            className={[
              nameOxanium.className,
              "border border-white/20 bg-white/5 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/80",
            ].join(" ")}
          >
            On profile
          </Link>
        </div>

        {open ? (
          <div className="mt-6">
            <ProfileProSkinUnlockOverlay
              unlockedIds={[...PRO_SKIN_UNLOCK_NOTICE_PREVIEW_IDS]}
              language="ja"
              preview
              platform="mobile"
              ownerCounts={ownerCounts}
              inline
              onDismiss={() => setOpen(false)}
            />
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-white/40">
            モーダルは閉じています。「Show modal」で再表示。
          </p>
        )}
      </div>
    </main>
  );
}
