import type { ReactNode } from "react";
import { APP_MAINTENANCE_MODE } from "@/lib/app/maintenanceMode";
import MaintenanceOverlayNative from "./MaintenanceOverlayNative";

export default function MaintenanceGateNative({ children }: { children: ReactNode }) {
  if (APP_MAINTENANCE_MODE) {
    return <MaintenanceOverlayNative />;
  }
  return <>{children}</>;
}
