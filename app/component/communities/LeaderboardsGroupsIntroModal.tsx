"use client";

import EventModal from "@/app/component/modals/EventModal";
import { LEADERBOARDS_GROUPS_INTRO_EVENT } from "@/lib/events/leaderboardsGroupsIntro";
import type { Language } from "@/lib/i18n/language";

type Props = {
  open: boolean;
  language: Language;
  onClose: () => void;
};

export default function LeaderboardsGroupsIntroModal({
  open,
  language,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <EventModal
      event={LEADERBOARDS_GROUPS_INTRO_EVENT}
      onClose={onClose}
      language={language}
    />
  );
}
