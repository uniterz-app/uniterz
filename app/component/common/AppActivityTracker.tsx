"use client";

import { useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions, auth } from "@/lib/firebase";

export default function AppActivityTracker() {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const log = httpsCallable(functions, "logUserActive");

    log({}).catch((e) => {
      console.error("Failed to log activity", e);
    });
  }, []);

  return null;
}
