/**
 * WC 2026 グループステージ（72試合）の日本向け放送媒体。
 * 全試合 DAZN ライブ配信 + 地上波（NHK / 日本テレビ / フジテレビ）があれば追加。
 * Firestore games.broadcastLabels が無いときのフォールバック。
 *
 * 地上波割当: NHK・日本テレビ・フジテレビ公式発表を ABEMA TIMES 一覧で照合
 * https://times.abema.tv/articles/-/10243707 （2026-06 時点）
 */
const DAZN_ONLY = ["DAZN"] as const;

function labels(...terrestrial: string[]): string[] {
  return terrestrial.length > 0 ? ["DAZN", ...terrestrial] : [...DAZN_ONLY];
}

export const WC_BROADCAST_LABELS: Record<string, string[]> = {
  // Group A
  "wc-2026-A-mex-zaf": labels("NHK"),
  "wc-2026-A-kor-cze": [...DAZN_ONLY],
  "wc-2026-A-cze-zaf": labels("日本テレビ"),
  "wc-2026-A-mex-kor": labels("NHK"),
  "wc-2026-A-cze-mex": labels("NHK"),
  "wc-2026-A-zaf-kor": [...DAZN_ONLY],

  // Group B
  "wc-2026-B-can-bih": labels("NHK"),
  "wc-2026-B-qat-che": [...DAZN_ONLY],
  "wc-2026-B-che-bih": [...DAZN_ONLY],
  "wc-2026-B-can-qat": [...DAZN_ONLY],
  "wc-2026-B-che-can": labels("NHK"),
  "wc-2026-B-bih-qat": [...DAZN_ONLY],

  // Group C
  "wc-2026-C-bra-mar": [...DAZN_ONLY],
  "wc-2026-C-hti-sct": labels("NHK"),
  "wc-2026-C-sct-mar": labels("フジテレビ"),
  "wc-2026-C-bra-hti": labels("NHK"),
  "wc-2026-C-sct-bra": [...DAZN_ONLY],
  "wc-2026-C-mar-hti": [...DAZN_ONLY],

  // Group D
  "wc-2026-D-usa-pry": [...DAZN_ONLY],
  "wc-2026-D-aus-tur": labels("日本テレビ"),
  "wc-2026-D-tur-pry": [...DAZN_ONLY],
  "wc-2026-D-usa-aus": labels("NHK"),
  "wc-2026-D-tur-usa": labels("日本テレビ"),
  "wc-2026-D-pry-aus": [...DAZN_ONLY],

  // Group E
  "wc-2026-E-deu-cuw": [...DAZN_ONLY],
  "wc-2026-E-civ-ecu": [...DAZN_ONLY],
  "wc-2026-E-deu-civ": labels("日本テレビ"),
  "wc-2026-E-ecu-cuw": [...DAZN_ONLY],
  "wc-2026-E-ecu-deu": [...DAZN_ONLY],
  "wc-2026-E-cuw-civ": [...DAZN_ONLY],

  // Group F（日本代表）
  "wc-2026-F-nld-jpn": labels("NHK"),
  "wc-2026-F-swe-tun": labels("日本テレビ"),
  "wc-2026-F-nld-swe": labels("NHK"),
  "wc-2026-F-tun-jpn": labels("日本テレビ"),
  "wc-2026-F-tun-nld": [...DAZN_ONLY],
  "wc-2026-F-jpn-swe": labels("NHK"),

  // Group G
  "wc-2026-G-bel-egy": labels("NHK"),
  "wc-2026-G-irn-nzl": [...DAZN_ONLY],
  "wc-2026-G-bel-irn": [...DAZN_ONLY],
  "wc-2026-G-nzl-egy": [...DAZN_ONLY],
  "wc-2026-G-nzl-bel": labels("日本テレビ"),
  "wc-2026-G-egy-irn": [...DAZN_ONLY],

  // Group H
  "wc-2026-H-esp-cpv": labels("NHK"),
  "wc-2026-H-sau-ury": [...DAZN_ONLY],
  "wc-2026-H-esp-sau": labels("NHK"),
  "wc-2026-H-ury-cpv": [...DAZN_ONLY],
  "wc-2026-H-ury-esp": labels("日本テレビ"),
  "wc-2026-H-cpv-sau": [...DAZN_ONLY],

  // Group I
  "wc-2026-I-fra-sen": labels("フジテレビ"),
  "wc-2026-I-irq-nor": [...DAZN_ONLY],
  "wc-2026-I-fra-irq": [...DAZN_ONLY],
  "wc-2026-I-nor-sen": labels("NHK"),
  "wc-2026-I-nor-fra": labels("NHK"),
  "wc-2026-I-sen-irq": [...DAZN_ONLY],

  // Group J
  "wc-2026-J-arg-dza": labels("NHK"),
  "wc-2026-J-aut-jor": [...DAZN_ONLY],
  "wc-2026-J-arg-aut": [...DAZN_ONLY],
  "wc-2026-J-jor-dza": [...DAZN_ONLY],
  "wc-2026-J-jor-arg": labels("NHK"),
  "wc-2026-J-dza-aut": [...DAZN_ONLY],

  // Group K
  "wc-2026-K-prt-cod": labels("フジテレビ"),
  "wc-2026-K-uzb-col": [...DAZN_ONLY],
  "wc-2026-K-prt-uzb": labels("NHK"),
  "wc-2026-K-col-cod": labels("日本テレビ"),
  "wc-2026-K-col-prt": labels("フジテレビ"),
  "wc-2026-K-cod-uzb": [...DAZN_ONLY],

  // Group L
  "wc-2026-L-eng-hrv": [...DAZN_ONLY],
  "wc-2026-L-gha-pan": [...DAZN_ONLY],
  "wc-2026-L-eng-gha": [...DAZN_ONLY],
  "wc-2026-L-pan-hrv": labels("フジテレビ"),
  "wc-2026-L-pan-eng": [...DAZN_ONLY],
  "wc-2026-L-hrv-gha": [...DAZN_ONLY],
};

function normalizeBroadcastLabels(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return [
      ...new Set(
        raw
          .map((x) => String(x ?? "").trim())
          .filter(Boolean)
      ),
    ];
  }
  if (typeof raw === "string" && raw.trim()) {
    return [raw.trim()];
  }
  return [];
}

export function lookupWcBroadcastLabels(gameId: string): string[] {
  const id = gameId.trim();
  if (!id) return [];
  return WC_BROADCAST_LABELS[id] ?? [];
}

/** @deprecated 単一フィールド互換。新規は broadcastLabels を使う */
export function lookupWcBroadcastLabel(gameId: string): string | null {
  const labels = lookupWcBroadcastLabels(gameId);
  return labels[0] ?? null;
}

export function resolveWcBroadcastLabels(
  gameId: string,
  raw: {
    broadcastLabels?: unknown;
    broadcastLabel?: unknown;
  } | null
  | undefined
): string[] {
  const fromArray = normalizeBroadcastLabels(raw?.broadcastLabels);
  if (fromArray.length > 0) return fromArray;
  const legacy = normalizeBroadcastLabels(raw?.broadcastLabel);
  if (legacy.length > 0) return legacy;
  return lookupWcBroadcastLabels(gameId);
}
