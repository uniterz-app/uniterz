/**
 * Web `useProSkinUnlockOverlay` の Native 版
 */
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  filterUnseenMilestoneUnlocks,
  parseProSkinUnlockNoticeIds,
  parseProSkinUnlockSeenIds,
  PRO_SKIN_UNLOCK_NOTICE_PREVIEW_IDS,
  proSkinUnlockNoticeSeenKey,
  serializeProSkinUnlockSeenIds,
} from "../../../../../../lib/profile/proSkinUnlockNotice";
import {
  parseProSkinOwnerCounts,
  PRO_SKIN_OWNER_COUNTS_DOC_PATH,
} from "../../../../../../lib/profile/proSkinOwnerCountsClient";
import type { ProfilePlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { dismissMeProSkinNoticesNative } from "../accountApiNative";

async function readSeen(uid: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(proSkinUnlockNoticeSeenKey(uid));
    return parseProSkinUnlockSeenIds(raw);
  } catch {
    return new Set();
  }
}

async function writeSeen(uid: string, ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(
      proSkinUnlockNoticeSeenKey(uid),
      serializeProSkinUnlockSeenIds(ids)
    );
  } catch {
    /* ignore */
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

export function useProSkinUnlockOverlayNative(opts: {
  uid: string | null | undefined;
  enabled: boolean;
  forcePreview?: boolean;
}): {
  activeIds: ProfilePlanProBgVariant[] | null;
  ownerCounts: Record<string, number>;
  preview: boolean;
  dismiss: () => void;
} {
  const { uid, enabled, forcePreview = false } = opts;
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

      if (forcePreview) {
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
        const notice = parseProSkinUnlockNoticeIds(
          data.proSkinUnlockNoticeIds
        );
        const unseen = filterUnseenMilestoneUnlocks(
          notice,
          await readSeen(uid)
        );
        if (!alive) return;
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
  }, [uid, enabled, forcePreview]);

  const dismiss = useCallback(() => {
    if (!uid || !activeIds) {
      setActiveIds(null);
      return;
    }
    if (!preview) {
      const ids = [...activeIds];
      void (async () => {
        const seen = await readSeen(uid);
        for (const id of ids) seen.add(id);
        await writeSeen(uid, seen);
        try {
          await dismissMeProSkinNoticesNative(ids);
        } catch {
          /* ローカル seen で二重表示は防げる */
        }
      })();
    }
    setActiveIds(null);
    setPreview(false);
  }, [uid, activeIds, preview]);

  return { activeIds, ownerCounts, preview, dismiss };
}
