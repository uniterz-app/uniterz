// lib/team-name-by-id.ts
import { TEAM_IDS } from "./team-ids";

export const TEAM_NAME_BY_ID: Record<string, string> =
  Object.fromEntries(
    Object.entries(TEAM_IDS).map(([name, id]) => [id, name])
  );
