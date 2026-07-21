import type { ReactNode } from "react";
import {
  APP_MAINTENANCE_MODE,
  APP_NBA_SEASON_RESTART_OVERLAY,
} from "@/lib/app/maintenanceMode";
import MaintenanceOverlayNative from "./MaintenanceOverlayNative";
import NbaSeasonRestartMaintenanceOverlayNative from "./NbaSeasonRestartMaintenanceOverlayNative";

export default function MaintenanceGateNative({ children }: { children: ReactNode }) {
  if (APP_MAINTENANCE_MODE) {
    return <MaintenanceOverlayNative />;
  }
  if (APP_NBA_SEASON_RESTART_OVERLAY) {
    return <NbaSeasonRestartMaintenanceOverlayNative />;
  }
  return <>{children}</>;
}
