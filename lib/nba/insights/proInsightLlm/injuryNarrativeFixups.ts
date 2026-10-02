/**
 * INJURY IMPACT: evidence は metrics からコードで組み立て、本文の OFF/DEF 差分は metrics の値で上書きする
 * （LLM は符号を落とす・evidence に本文を写すため）。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type {
  ProInsightFact,
  ProInsightFactPack,
} from "@/lib/nba/insights/proInsightFacts/types";
import { shortLabel } from "@/lib/nba/insights/proInsightFacts/injuryShapeRoles";
import type {
  ProInsightNarrativeBrief,
  ProInsightNarrativeItem,
} from "@/lib/predict/proInsightNarrativeTypes";

function metric(fact: ProInsightFact, key: string): string | null {
  const m = fact.metrics.find((x) => x.key === key);
  return m == null || m.value === "" ? null : String(m.value);
}

function signed(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return n > 0 ? `+${n}` : String(n);
}

export function renderInjuryEvidence(fact: ProInsightFact): UiStrings {
  const player = fact.players[0];
  const name = player?.playerName ?? "";
  const status = player?.status ?? metric(fact, "status") ?? "";
  const ja: string[] = [`${name} ${status}`];
  const en: string[] = [`${name} ${status}`];

  const roles = (metric(fact, "narrativeRoles") ?? metric(fact, "shapeRoles") ?? "")
    .split(",")
    .filter(Boolean);
  for (const role of roles.slice(0, 2)) {
    const rank = metric(fact, `${role}TeamRank`);
    const value = metric(fact, role);
    if (!rank) continue;
    const label = shortLabel(role);
    const v = value ? `（${value}）` : "";
    ja.push(`チーム${label} ${rank}${v}`);
    en.push(`team ${label} ${rank}${value ? ` (${value})` : ""}`);
  }

  const wl = metric(fact, "aceOutWl");
  if (wl) {
    const prior = metric(fact, "aceOutSeason") === "prior";
    const pts = metric(fact, "aceOutPts");
    ja.push(`欠場時 ${wl}${prior ? "（昨季）" : ""}${pts ? ` ${pts}` : ""}`);
    en.push(`when out ${wl}${prior ? " (last season)" : ""}${pts ? ` ${pts}` : ""}`);
  }

  const off = metric(fact, "aceOutOffDelta");
  const def = metric(fact, "aceOutDefDelta");
  const delta = [off ? `OFF ${signed(off)}` : "", def ? `DEF ${signed(def)}` : ""]
    .filter(Boolean)
    .join(" / ");
  if (delta) {
    ja.push(delta);
    en.push(delta);
  }

  return { ja: ja.join(" · "), en: en.join(" · ") };
}

function fixDeltas(text: string, fact: ProInsightFact): string {
  let out = text;
  const off = metric(fact, "aceOutOffDelta");
  const def = metric(fact, "aceOutDefDelta");
  if (off) out = out.replace(/OFF\s*[+\-−]?\s*\d+(?:\.\d+)?/g, `OFF ${signed(off)}`);
  if (def) out = out.replace(/DEF\s*[+\-−]?\s*\d+(?:\.\d+)?/g, `DEF ${signed(def)}`);
  return out;
}

const WL_RE = /\b\d{1,2}\s*[-–]\s*\d{1,2}\b/;

/** when-out 実績が無い fact で LLM が書いた W–L 文は捏造なので落とす */
function dropInventedWl(text: string, fact: ProInsightFact, lang: string): string {
  if (metric(fact, "aceOutWl")) return text;
  if (!WL_RE.test(text)) return text;
  const parts =
    lang === "ja" || lang.startsWith("zh")
      ? text.split(/(?<=[。！？])/)
      : text.split(/(?<=[.!?])\s+/);
  const kept = parts.filter((p) => !WL_RE.test(p));
  const joined = kept.join(lang === "ja" || lang.startsWith("zh") ? "" : " ").trim();
  if (!joined) return text;
  return /[。.!?！？]$/.test(joined) ? joined : `${joined}${lang === "ja" ? "。" : "."}`;
}

function lastName(playerName: string): string {
  return playerName.replace(/^[A-Za-z]\./, "").trim().toLowerCase();
}

function factForItem(
  item: ProInsightNarrativeItem,
  index: number,
  facts: ProInsightFact[]
): ProInsightFact | null {
  const text = `${item.body.en ?? ""} ${item.body.ja ?? ""}`.toLowerCase();
  const byName = facts.find((f) => {
    const n = f.players[0]?.playerName;
    return n ? text.includes(lastName(n)) : false;
  });
  return byName ?? facts[index] ?? null;
}

export function withInjuryFixups(
  brief: ProInsightNarrativeBrief,
  pack: ProInsightFactPack
): ProInsightNarrativeBrief {
  const facts = pack.sections["INJURY IMPACT"] ?? [];
  if (facts.length === 0) return brief;
  return {
    ...brief,
    sections: brief.sections.map((s) =>
      s.kind !== "INJURY IMPACT"
        ? s
        : {
            ...s,
            items: s.items.map((item, i) => {
              const fact = factForItem(item, i, facts);
              if (!fact) return item;
              const body = { ...item.body } as Record<string, string>;
              for (const [lang, text] of Object.entries(body)) {
                if (typeof text === "string") {
                  body[lang] = dropInventedWl(fixDeltas(text, fact), fact, lang);
                }
              }
              return {
                body: body as UiStrings,
                evidence: [renderInjuryEvidence(fact)],
              };
            }),
          }
    ),
  };
}
