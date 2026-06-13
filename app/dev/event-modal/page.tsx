// app/dev/event-modal/page.tsx
"use client";

import { useState } from "react";
import EventModal from "@/app/component/modals/EventModal";
import { LEADERBOARDS_GROUPS_INTRO_EVENT } from "@/lib/events/leaderboardsGroupsIntro";
import { WC_UNIFORM_CHALLENGE_NOTICE } from "@/lib/events/wcUniformChallengeNotice";

type Variant = "wc" | "groups";

const EVENTS: Record<Variant, typeof WC_UNIFORM_CHALLENGE_NOTICE> = {
  wc: WC_UNIFORM_CHALLENGE_NOTICE,
  groups: LEADERBOARDS_GROUPS_INTRO_EVENT,
};

export default function DevEventModalPage() {
  const [open, setOpen] = useState(true);
  const [variant, setVariant] = useState<Variant>("wc");

  const event = EVENTS[variant];

  return (
    <div
      className="min-h-dvh text-white"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,255,0.06), transparent 55%), #020304",
      }}
    >
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-[11px] tracking-[0.2em] text-cyan-400/60">
          DEV PREVIEW · CYBER EVENT MODAL
        </p>
        <h1 className="mt-2 text-lg font-semibold">インフォメーションモーダル案</h1>
        <p className="mt-2 text-sm text-white/50">
          背面は透明。リロードまたは「モーダルを開く」で何度でも確認できます。
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["wc", "WCユニフォーム"],
              ["groups", "グループ告知"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setVariant(key);
                setOpen(true);
              }}
              className={[
                "border px-3 py-1.5 text-xs tracking-wider transition-colors",
                variant === key
                  ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-100"
                  : "border-white/15 text-white/45",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100"
        >
          モーダルを開く
        </button>
      </div>

      {open ? (
        <EventModal
          event={event}
          language="ja"
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
