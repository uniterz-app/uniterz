"use client";

import { useSyncExternalStore } from "react";
import {
  getAppPageAtmosphere,
  subscribeAppPageAtmosphere,
  type AppPageAtmosphere,
} from "@/lib/ui/appPageAtmosphere";

export function useAppPageAtmosphere(): AppPageAtmosphere {
  return useSyncExternalStore(
    subscribeAppPageAtmosphere,
    getAppPageAtmosphere,
    () => "default"
  );
}
