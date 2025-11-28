"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { toMatchCardProps } from "@/lib/games/transform";

type State =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: null; error: null }
  | { status: "loaded"; data: ReturnType<typeof toMatchCardProps>; error: null }
  | { status: "error"; data: null; error: string };

export function useGameById(id?: string | null) {
  const [state, setState] = useState<State>({ status: "idle", data: null, error: null });

  useEffect(() => {
    if (!id) {
      setState({ status: "idle", data: null, error: null });
      return;
    }
    let aborted = false;
    setState({ status: "loading", data: null, error: null });

    (async () => {
      try {
        const snap = await getDoc(doc(db, "games", id));
        if (aborted) return;

        if (!snap.exists()) {
          setState({ status: "error", data: null, error: "not_found" });
          return;
        }
        const raw = { id, ...snap.data() }; // id を混ぜる
        const gameProps = toMatchCardProps(raw as any, { dense: false });
        setState({ status: "loaded", data: gameProps, error: null });
      } catch (e: any) {
        console.warn("[useGameById] getDoc error:", e);
        if (!aborted) setState({ status: "error", data: null, error: e?.message ?? "error" });
      }
    })();

    return () => {
      aborted = true;
    };
  }, [id]);

  return state;
}
