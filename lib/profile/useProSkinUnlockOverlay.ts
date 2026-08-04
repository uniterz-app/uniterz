"use client";

/**
 * プロフィール復帰時: 未読のマイルストーン解放をキュー表示。
 * `?forceSkinUnlock=1` でプレビュー強制。
 */
import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dismissMeProSkinNotices } from "@/lib/api/saveMeProSkin";
import {
  filterUnseenMilestoneUnlocks,
  parseProSkinUnlockNoticeIds,
  parseProSkinUnlockSeenIds,
  PRO_SKIN_UNLOCK_NOTICE_PREVIEW_IDS,
  proSkinUnlockNoticeSeenKey,
  serializeProSkinUnlockSeenIds,
} from "@/lib/profile/proSkinUnlockNotice";
import {
  parseProSkinOwnerCounts,
  PRO_SKIN_OWNER_COUNTS_DOC_PATH,
} from "@/lib/profile/proSkinOwnerCountsClient";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";

function readSeen(uid: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return parseProSkinUnlockSeenIds(
      window.localStorage.getItem(proSkinUnlockNoticeSeenKey(uid))
    );
  } catch {
    return new Set();
  }
}

function writeSeen(uid: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      proSkinUnlockNoticeSeenKey(uid),
      serializeProSkinUnlockSeenIds(ids)
    );
  } catch {
    /* ignore */
  }
}

function forcePreviewFromQuery(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      new URLSearchParams(window.location.search).get("forceSkinUnlock") === "1"
    );
  } catch {
    return false;
  }
}

async function loadOwnerCounts(): Promise<Record<string, number>> {
  try {
    const snap = await getDoc(doc(db, PRO_SKIN_OWNER_COUNTS_DOC_PATH));
    if (!snap.exists()) return {};
    return parseProSkinOwnerCounts(snap.data());
  } catch {
    return {};
  }
}

export function useProSkinUnlockOverlay(opts: {
  uid: string | null;
  enabled: boolean;
}): {
  activeIds: ProfilePlanProBgVariant[] | null;
  ownerCounts: Record<string, number>;
  preview: boolean;
  dismiss: () => void;
} {
  const { uid, enabled } = opts;
  const [activeIds, setActiveIds] = useState<ProfilePlanProBgVariant[] | null>(
    null
  );
  const [ownerCounts, setOwnerCounts] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!enabled || !uid) {
      setActiveIds(null);
      setOwnerCounts({});
      setPreview(false);
      return;
    }
    let alive = true;

    void (async () => {
      const counts = await loadOwnerCounts();
      if (!alive) return;
      setOwnerCounts(counts);

      if (forcePreviewFromQuery()) {
        setPreview(true);
        setActiveIds([...PRO_SKIN_UNLOCK_NOTICE_PREVIEW_IDS]);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!alive) return;
        const data = snap.exists()
          ? (snap.data() as Record<string, unknown>)
          : {};
        // ライブ達成キューのみ（Free→Pro 遡及は notice に載らない）
        const notice = parseProSkinUnlockNoticeIds(
          data.proSkinUnlockNoticeIds
        );
        const unseen = filterUnseenMilestoneUnlocks(notice, readSeen(uid));
        setPreview(false);
        setActiveIds(unseen.length > 0 ? unseen : null);
      } catch {
        if (!alive) return;
        setActiveIds(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [uid, enabled]);

  const dismiss = useCallback(() => {
    if (!uid || !activeIds) {
      setActiveIds(null);
      return;
    }
    if (!preview) {
      const ids = [...activeIds];
      const seen = readSeen(uid);
      for (const id of ids) seen.add(id);
      writeSeen(uid, seen);
      void dismissMeProSkinNotices(ids).catch(() => {
        /* ローカル seen で二重表示は防げる */
      });
    }
    setActiveIds(null);
    setPreview(false);
  }, [uid, activeIds, preview]);

  return { activeIds, ownerCounts, preview, dismiss };
}
