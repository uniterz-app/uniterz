import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "./CyberSlantedTabNative";

const STAGES: Array<{ id: WcRankingStage; labelKey: "stageAll" | "stageGroup" | "stageKnockout" }> = [
  { id: "overall", labelKey: "stageAll" },
  { id: "qualifying", labelKey: "stageGroup" },
  { id: "main", labelKey: "stageKnockout" },
];

type Props = {
  stage: WcRankingStage;
  onChange: (stage: WcRankingStage) => void;
  language: RankingsLanguage;
};

/** Web `WcRankingStageTabs` のネイティブ版 */
export default function WcRankingStageTabsNative({ stage, onChange, language }: Props) {
  const t = rankingsTexts(language);

  return (
    <CyberSlantedTabBarNative fill>
      {STAGES.map((s) => {
        const active = stage === s.id;
        return (
          <CyberSlantedTabNative
            key={s.id}
            label={t[s.labelKey]}
            active={active}
            fill
            compact
            onPress={() => onChange(s.id)}
          />
        );
      })}
    </CyberSlantedTabBarNative>
  );
}
