/**
 * Web `useProfile` の Firestore 解決（handle / uid → users ドキュメント）。
 */
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { looksLikeFirestoreUid } from "../../../../../lib/profile/profilePathKey";
import { parseUserProfileFields } from "../../../../../lib/profile/parseUserProfileFields";
import { parseMemberSinceMs } from "../../../../../lib/profile/parseMemberSinceMs";

export type NativeProfileByHandleState = {
  loading: boolean;
  notFound: boolean;
  targetUid: string | null;
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  language: "ja" | "en";
  countryCode: string;
  plan: "free" | "pro";
  currentStreak: number;
  maxStreak: number;
  memberSinceMs: number | null;
};

const idleState: NativeProfileByHandleState = {
  loading: false,
  notFound: false,
  targetUid: null,
  displayName: "",
  handle: "",
  bio: "",
  avatarUrl: "",
  language: "ja",
  countryCode: "",
  plan: "free",
  currentStreak: 0,
  maxStreak: 0,
  memberSinceMs: null,
};

async function fetchUserDocByRouteKey(
  decodedHandle: string
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  if (looksLikeFirestoreUid(decodedHandle)) {
    const byUid = await getDoc(doc(db, "users", decodedHandle));
    if (byUid.exists()) {
      return { id: byUid.id, data: byUid.data() as Record<string, unknown> };
    }
  }

  const snap = await getDocs(
    query(collection(db, "users"), where("handle", "==", decodedHandle), limit(1))
  );
  if (!snap.empty) {
    const d = snap.docs[0]!;
    return { id: d.id, data: d.data() as Record<string, unknown> };
  }

  if (!looksLikeFirestoreUid(decodedHandle)) {
    const byUid = await getDoc(doc(db, "users", decodedHandle));
    if (byUid.exists()) {
      return { id: byUid.id, data: byUid.data() as Record<string, unknown> };
    }
  }

  return null;
}

function mapUserDoc(
  id: string,
  data: Record<string, unknown>
): NativeProfileByHandleState {
  const { displayName, handle } = parseUserProfileFields(data);
  const fromFirestorePhoto =
    typeof data.photoURL === "string" && data.photoURL.trim().length > 0
      ? data.photoURL.trim()
      : typeof data.avatarUrl === "string" && data.avatarUrl.trim().length > 0
        ? data.avatarUrl.trim()
        : "";

  return {
    loading: false,
    notFound: false,
    targetUid: id,
    displayName,
    handle: typeof data.handle === "string" ? data.handle.trim() : handle,
    bio: typeof data.bio === "string" ? data.bio : "",
    avatarUrl: fromFirestorePhoto,
    language: data.language === "en" ? "en" : "ja",
    countryCode: typeof data.countryCode === "string" ? data.countryCode : "",
    plan: data.plan === "pro" ? "pro" : "free",
    currentStreak:
      typeof data.currentStreak === "number" && Number.isFinite(data.currentStreak)
        ? Math.max(0, Math.floor(data.currentStreak))
        : 0,
    maxStreak:
      typeof data.maxStreak === "number" && Number.isFinite(data.maxStreak)
        ? Math.max(0, Math.floor(data.maxStreak))
        : 0,
    memberSinceMs: parseMemberSinceMs(data),
  };
}

export function useNativeProfileByHandle(routeKey: string | undefined | null) {
  const decoded = useMemo(() => {
    const raw = typeof routeKey === "string" ? routeKey.trim() : "";
    if (!raw) return "";
    try {
      return decodeURIComponent(raw).trim();
    } catch {
      return raw;
    }
  }, [routeKey]);

  const [state, setState] = useState<NativeProfileByHandleState>(() =>
    decoded
      ? { ...idleState, loading: true }
      : idleState
  );

  useEffect(() => {
    if (!decoded) {
      setState(idleState);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, notFound: false }));

    void (async () => {
      try {
        const docSnap = await fetchUserDocByRouteKey(decoded);
        if (cancelled) return;

        if (!docSnap) {
          setState({
            ...idleState,
            loading: false,
            notFound: true,
          });
          return;
        }

        setState(mapUserDoc(docSnap.id, docSnap.data));
      } catch {
        if (cancelled) return;
        setState({
          ...idleState,
          loading: false,
          notFound: true,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [decoded]);

  return { ...state, routeKey: decoded };
}
