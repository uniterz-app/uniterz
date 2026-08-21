/**
 * アプリ起動時 — 募集中の大会があれば開催モーダルを一度表示（Web mobile）
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SquadBattleLaunchOverlay from "@/app/component/squads/SquadBattleLaunchOverlay";
import {
  markSquadBattleLaunchSeen,
  readSquadBattleLaunchSeenBattleId,
} from "@/app/component/squads/SquadBattleLaunchOverlay";
import {
  formatSquadBattleRecruitDeadlineLabel,
  shouldShowSquadBattleLaunch,
} from "@/lib/squads/squadBattleLaunchGate";

export default function SquadBattleLaunchPromptHost() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [deadlineLabel, setDeadlineLabel] = useState<string | null>(null);
  const decidedRef = useRef(false);

  const evaluate = useCallback(async () => {
    if (decidedRef.current) return;
    // スクワッドバトル画面上ではページ側に任せる（二重表示防止）
    if (pathname?.includes("/squad-battle")) return;
    try {
      const { auth } = await import("@/lib/firebase");
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const { fetchCurrentGroupBattle } = await import(
        "@/lib/groupBattles/clientApi"
      );
      const current = await fetchCurrentGroupBattle({ idToken: token });
      const battle = current?.battle;
      if (
        !shouldShowSquadBattleLaunch({
          battleId: battle?.id,
          phase: battle?.phase,
          seenBattleId: readSquadBattleLaunchSeenBattleId(),
        })
      ) {
        decidedRef.current = true;
        return;
      }
      decidedRef.current = true;
      // 表示開始時に記録（他面との二重表示を防ぐ）
      markSquadBattleLaunchSeen(battle!.id);
      setBattleId(battle!.id);
      setDeadlineLabel(
        formatSquadBattleRecruitDeadlineLabel(battle!.recruitEndAtMs)
      );
      setOpen(true);
    } catch {
      // ignore
    }
  }, [pathname]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void evaluate();
    }, 900);
    return () => window.clearTimeout(t);
  }, [evaluate]);

  return (
    <SquadBattleLaunchOverlay
      open={open}
      battleId={battleId}
      deadlineLabel={deadlineLabel}
      onClose={() => setOpen(false)}
      onEnter={() => {
        setOpen(false);
        router.push("/mobile/squad-battle");
      }}
    />
  );
}
