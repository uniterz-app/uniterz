import { ReactNode } from "react";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { helpFaqsCopy, type HelpFaqEntryCopy } from "../../../../../lib/settings/helpFaqsCopy";
import { helpPageCopy } from "../../../../../lib/settings/helpPageCopy";
import HelpScoringLogicNative from "./HelpScoringLogicNative";
import { HelpAnswerText, HelpBulletList, HelpFaqItemNative } from "./HelpAccordionItemNative";

function faqIcon(
  id: HelpFaqEntryCopy["id"]
): ComponentProps<typeof MaterialCommunityIcons>["name"] {
  switch (id) {
    case "form":
      return "gamepad-variant";
    case "stats":
      return "chart-bar";
    case "scoring-logic":
      return "function-variant";
    case "ranking":
      return "trophy";
  }
}

function HelpNoteNative({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.note}>
      <Text style={styles.noteTitle}>{title}</Text>
      <Text style={styles.noteBody}>{body}</Text>
    </View>
  );
}

function renderFaqAnswer(entry: HelpFaqEntryCopy): ReactNode {
  switch (entry.id) {
    case "form":
      return (
        <>
          <HelpAnswerText>{entry.intro}</HelpAnswerText>
          <HelpBulletList items={[...entry.bullets]} />
          <HelpAnswerText>{entry.outro}</HelpAnswerText>
        </>
      );
    case "stats":
      return (
        <>
          <HelpBulletList items={[...entry.bullets]} />
          <HelpAnswerText>{entry.outro}</HelpAnswerText>
        </>
      );
    case "scoring-logic":
      return (
        <HelpScoringLogicNative
          intro={entry.intro}
          defaultOpenId="totalPoints"
          sections={entry.sections}
        />
      );
    case "ranking":
      return (
        <>
          <HelpAnswerText>{entry.intro}</HelpAnswerText>
          <HelpBulletList items={[...entry.bullets]} />
          <HelpAnswerText>{entry.outro}</HelpAnswerText>
          <HelpNoteNative title={entry.noteTitle} body={entry.noteBody} />
        </>
      );
  }
}

/** Web `HelpPage` FAQ 相当 — 文言は `lib/settings/helpFaqsCopy` */
export function getHelpFaqsNative(
  language: string | null | undefined
): HelpFaqItemNative[] {
  return helpFaqsCopy(language).map((entry) => ({
    id: entry.id,
    label: entry.label,
    question: entry.question,
    icon: faqIcon(entry.id),
    answer: renderFaqAnswer(entry),
  }));
}

export function getHelpPageCopy(language: string | null | undefined) {
  return helpPageCopy(language);
}

const styles = StyleSheet.create({
  note: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  noteTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
  },
});
