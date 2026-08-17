/** NBA-only: legacy WC UI/types — no-op shims for removed World Cup modules */
import React from "react";
import { Text, type TextStyle } from "react-native";

export type GoalScorerPick = { playerId: string; teamId: string };

export type WcGoalScorerPostLike = Record<string, unknown>;
export type WcGoalScorerResultInfo = {
  label: string;
  hit: boolean;
  playerName: string;
};

export function normalizeWcGoalScorerPick(raw: unknown): GoalScorerPick | null {
  if (!raw || typeof raw !== "object") return null;
  const playerId = String((raw as GoalScorerPick).playerId ?? "").trim();
  const teamId = String((raw as GoalScorerPick).teamId ?? "").trim();
  if (!playerId || !teamId) return null;
  return { playerId, teamId };
}

export function isWcGoalScorerPickValidForPredictedScore(..._args: unknown[]): boolean {
  return false;
}

export function resolveWcBroadcastLabels(..._args: unknown[]): string[] {
  return [];
}

export function isWcKnockoutGame(..._args: unknown[]): boolean {
  return false;
}

export function resolveWcGroupStageStandingForKnockoutDisplay(..._args: unknown[]): null {
  return null;
}

export function resolveWcResultCardGroupStanding(..._args: unknown[]): null {
  return null;
}

export function resolveWcGroupCodeLabel(..._args: unknown[]): null {
  return null;
}

export function resolveWcMatchGoalScorersForDisplay(..._args: unknown[]): never[] {
  return [];
}

export function hasWcMatchPreview(..._args: unknown[]): boolean {
  return false;
}

export function getWcSquadPlayer(..._args: unknown[]): { name: string } | null {
  return null;
}

export const WC_DEFAULT_SEASON = "WC2026";

export function teamIdToWcCountry(..._args: unknown[]): null {
  return null;
}

export function resolveWcTeamId(...args: unknown[]): string | null {
  for (const a of args) {
    if (a && typeof a === "object" && "teamId" in (a as object)) {
      const id = (a as { teamId?: string }).teamId;
      if (typeof id === "string" && id.trim()) return id.trim();
    }
    if (typeof a === "string" && a.trim()) return a.trim();
  }
  return null;
}

export function useWcGoalScorerResultNative(_post: WcGoalScorerPostLike): WcGoalScorerResultInfo | null {
  return null;
}

export function resolveWcGoalScorerResultNative(..._args: unknown[]): null {
  return null;
}

type WcFlagProps = {
  children?: React.ReactNode;
  teamId?: string | null;
  knockout?: boolean;
  compact?: boolean;
};

export function WcTeamFlagWithMetaNative({ children }: WcFlagProps) {
  return <>{children}</>;
}

export function WcGroupStandingRecordLineNative(_props: Record<string, unknown>) {
  return null;
}

export function WcGoalScorerResultRowNative(_props: Record<string, unknown>) {
  return null;
}

export function WcMatchGoalScorersColumnNative(_props: Record<string, unknown>) {
  return null;
}

export function WcTeamNameMobileNative({
  name,
  style,
  fit: _fit,
  containerStyle: _containerStyle,
}: {
  name: string;
  style?: TextStyle | TextStyle[];
  fit?: boolean;
  containerStyle?: TextStyle;
}) {
  return (
    <Text style={style} numberOfLines={1}>
      {name}
    </Text>
  );
}

export function WcBroadcastNamesNative(_props: Record<string, unknown>) {
  return null;
}

export function WcGoalScorerPickerNative(_props: Record<string, unknown>) {
  return null;
}

export function WcMatchPreviewPanelNative(_props: Record<string, unknown>) {
  return null;
}

export function WcStandingPanelNative(_props: Record<string, unknown>) {
  return null;
}

export function WcPastResultsPanelNative(_props: Record<string, unknown>) {
  return null;
}

export function WcTeamProfilePanelNative(_props: Record<string, unknown>) {
  return null;
}

export function WcScoringRulesNative(_props: Record<string, unknown>) {
  return null;
}

export type WcGroupStandingEntry = Record<string, unknown>;

export function formatWcGroupStageRecordLabel(..._args: unknown[]): string {
  return "";
}
