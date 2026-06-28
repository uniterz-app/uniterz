/**
 * WC 2026（グループ72 + ノックアウト32）の日本向け放送媒体。
 * 全試合 DAZN ライブ配信 + 地上波（NHK / 日本テレビ / フジテレビ / NHK BS）があれば追加。
 * Firestore games.broadcastLabels が無いときのフォールバック。
 *
 * グループ: ABEMA TIMES 一覧で照合 https://times.abema.tv/articles/-/10243707
 * ノックアウト: Goal.com 番組表 + 各局公式（2026-06 時点）
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

  // Knockout — Round of 32 (M73–M88)
  // 地上波割当: Goal.com 番組表 / 各局公式（2026-06 時点）
  // https://www.goal.com/jp/%E3%83%AA%E3%82%B9%E3%83%88/2026-world-cup-all-tv-guide/blt70f25e7f12788cd5
  "wc-2026-ko-M73": labels("NHK"), // 南アフリカ vs カナダ
  "wc-2026-ko-M74": [...DAZN_ONLY], // ドイツ vs パラグアイ（BSP4K 録画のみ）
  "wc-2026-ko-M75": labels("NHK"), // オランダ vs モロッコ
  "wc-2026-ko-M76": labels("フジテレビ", "NHK BS"), // ブラジル vs 日本
  "wc-2026-ko-M77": labels("フジテレビ"), // フランス vs スウェーデン
  "wc-2026-ko-M78": labels("日本テレビ"), // コートジボワール vs ノルウェー
  "wc-2026-ko-M79": labels("NHK"), // メキシコ vs エクアドル
  "wc-2026-ko-M80": labels("フジテレビ"), // イングランド vs DRコンゴ
  "wc-2026-ko-M81": labels("NHK"), // アメリカ vs ボスニア
  "wc-2026-ko-M82": labels("NHK"), // ベルギー vs セネガル
  "wc-2026-ko-M83": labels("日本テレビ"), // ポルトガル vs クロアチア
  "wc-2026-ko-M84": labels("NHK"), // スペイン vs オーストリア
  "wc-2026-ko-M85": labels("NHK"), // スイス vs アルジェリア（Eテレ→総合）
  "wc-2026-ko-M86": labels("日本テレビ"), // アルゼンチン vs カーボベルデ
  "wc-2026-ko-M87": [...DAZN_ONLY], // コロンビア vs ガーナ（BSP4K 録画のみ）
  "wc-2026-ko-M88": labels("NHK"), // オーストラリア vs エジプト

  // Knockout — Round of 16 以降（試合枠固定・対戦カードはブラケット依存）
  "wc-2026-ko-M89": [...DAZN_ONLY],
  "wc-2026-ko-M90": labels("日本テレビ"),
  "wc-2026-ko-M91": [...DAZN_ONLY],
  "wc-2026-ko-M92": [...DAZN_ONLY],
  "wc-2026-ko-M93": labels("日本テレビ"),
  "wc-2026-ko-M94": [...DAZN_ONLY],
  "wc-2026-ko-M95": [...DAZN_ONLY],
  "wc-2026-ko-M96": [...DAZN_ONLY],
  "wc-2026-ko-M97": [...DAZN_ONLY],
  "wc-2026-ko-M98": [...DAZN_ONLY],
  "wc-2026-ko-M99": [...DAZN_ONLY],
  "wc-2026-ko-M100": [...DAZN_ONLY],
  "wc-2026-ko-M101": [...DAZN_ONLY],
  "wc-2026-ko-M102": [...DAZN_ONLY],
  "wc-2026-ko-M103": labels("NHK"), // 3位決定戦（予想対象外）
  "wc-2026-ko-M104": labels("NHK"), // 決勝
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
