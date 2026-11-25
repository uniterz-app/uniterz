import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";

/**
 * 起動シートに載せるもののルール。
 *
 * 出すのは、次に開いたとき届き方か記録の仕方が変わることだけ。1件が基本、最大2件。
 * 各件は見出し（変化を言い切る）1行。補足は見出しが足りないときだけ。言い直しは書かない。
 *
 * 出す:
 * - 通知・記録・画面の動きが変わる
 * - 期限があるもの（いつまで、何をすると、何が残るか。3つのうち2つ以上）
 *
 * 出さない:
 * - バグ修正、速度、余白、色
 * - 「開催中」だけで中身が無い一文
 * - 3件目以降（読み飛ばされる。余ったものはお知らせ一覧）
 */
export type WhatsNewKind = "update" | "feature" | "event";

/** シートの CTA / 本文行が開く先。Native 側で画面に落とす。 */
export type WhatsNewActionRoute =
  | "notificationSettings"
  | "announcements"
  | "gamesHome"
  | "resultHome";

export type WhatsNewNoteAction = {
  label: UiStrings;
  route: WhatsNewActionRoute;
  /**
   * true のとき Free は行き先の中身を開かず Pro ゲートだけ出す。
   * Pro 機能の案内行・CTA に付ける。
   */
  proOnly?: boolean;
};

/** 展開本文の1行。route があるとその行から遷移できる。 */
export type WhatsNewBodyLine = {
  text: UiStrings;
  route?: WhatsNewActionRoute;
  /** Free は中身を見せず Pro ゲートだけ。 */
  proOnly?: boolean;
};

/** イベント賞品1行。place をシアン太字、prize を白で分ける。 */
export type WhatsNewEventPrize = {
  place: UiStrings;
  prize: UiStrings;
};

export type WhatsNewNote = {
  id: string;
  kind: WhatsNewKind;
  /**
   * イベント名。kind が event のとき EVENT 直下に出す。
   * 無ければ headline を名前として使う。
   */
  name?: UiStrings;
  /** 変化を言い切る。1行。event で name があるときは補足に回さない（detail を使う）。 */
  headline: UiStrings;
  /**
   * いつ届く / 届かない / どこで見る。見出しだけで足りるなら省略。
   * event で prizes があるときは短い説明だけ（賞品は prizes / scope / footnote）。
   */
  detail?: UiStrings;
  /** 対象範囲（event）。例: 12月のピックアップ試合 */
  scope?: UiStrings;
  /** 賞品行（event）。あると detail 一括より階層を分けて描く */
  prizes?: readonly WhatsNewEventPrize[];
  /** 末尾の注記（event）。例: 賞品は登録メールでご連絡します */
  footnote?: UiStrings;
  /**
   * イベント用ヒーロー。絶対 URL、または `/event/...` のようなサイト相対パス。
   * 相対パスは Native で API base を付ける。
   */
  imageUrl?: string;
  /**
   * 展開本文（行ごと）。あると「詳しく見る」でシート内に展開する。
   * 起動の要約には出さない。
   */
  bodyLines?: readonly WhatsNewBodyLine[];
  /**
   * @deprecated `bodyLines` を使う。残っているときは改行で行に分け、遷移なし。
   */
  body?: UiStrings;
  /** あるときシートに主ボタン。bodyLines があるときは展開用。 */
  action?: WhatsNewNoteAction;
};

/**
 * この id を変えると、一度閉じた人にも次の起動で出る。
 * 中身を差し替えたら必ず変える。
 */
export const WHATS_NEW_RELEASE_ID = "2026-11-results";

/** 起動に載せる上限。3件目以降は出さない。 */
export const WHATS_NEW_LAUNCH_LIMIT = 2;

/**
 * 起動に載せる行。無い種類は入れない。
 * 先頭がシートの見出しになる。2件目は補足。
 * ※ App 未接続。載せるときはホストをマウントし RELEASE_ID を変える。
 */
export const WHATS_NEW_NOTES: readonly WhatsNewNote[] = [
  {
    id: "2026-11-results-update",
    kind: "update",
    headline: {
      ja: "的中は、結果が出た日だけ届く",
      en: "Hits arrive only on days with a result",
    },
  },
  {
    id: "2026-11-results-feature",
    kind: "feature",
    headline: {
      ja: "連続予想は 3・7・30日だけ",
      en: "Streaks only at 3, 7, and 30 days",
    },
    action: {
      label: {
        ja: "通知設定を見る",
        en: "Open notification settings",
      },
      route: "notificationSettings",
    },
  },
];

function noteHasCopy(note: WhatsNewNote): boolean {
  return note.headline.ja.trim().length > 0 || note.headline.en.trim().length > 0;
}

/** 空行を除き、先頭から最大2件。 */
export function whatsNewLaunchNotes(): readonly WhatsNewNote[] {
  return WHATS_NEW_NOTES.filter(noteHasCopy).slice(0, WHATS_NEW_LAUNCH_LIMIT);
}

/**
 * 開発プレビュー用。起動に出す行と同じ。
 */
export const WHATS_NEW_PREVIEW_NOTES: readonly WhatsNewNote[] = WHATS_NEW_NOTES;

/**
 * 新イベントだけの見本（通知テスト「新イベント」用。本番起動には載せない）。
 */
export const WHATS_NEW_EVENT_PREVIEW_NOTES: readonly WhatsNewNote[] = [
  {
    id: "2026-12-monthly-ranking",
    kind: "event",
    name: {
      ja: "12月 SCORE RUSH",
      en: "December SCORE RUSH",
    },
    headline: {
      ja: "12月 SCORE RUSH",
      en: "December SCORE RUSH",
    },
    detail: {
      ja: "ピックアップのスコアで競う、\n全員参加の月間決戦。",
      en: "A month-long pickup score battle.\nOpen to everyone.",
    },
    scope: {
      ja: "12月のピックアップ試合",
      en: "December pickup games",
    },
    prizes: [
      {
        place: { ja: "1位", en: "1st" },
        prize: { ja: "NBA Mega Mystery Box", en: "NBA Mega Mystery Box" },
      },
      {
        place: { ja: "2位", en: "2nd" },
        prize: { ja: "NBA Ballers ×2", en: "NBA Ballers ×2" },
      },
      {
        place: { ja: "3位", en: "3rd" },
        prize: {
          ja: "NBA Mega Mystery Box パック ×5",
          en: "NBA Mega Mystery Box pack ×5",
        },
      },
      {
        place: { ja: "100位ぴったり", en: "Exact 100th" },
        prize: {
          ja: "NBA Mega Mystery Box パック ×3",
          en: "NBA Mega Mystery Box pack ×3",
        },
      },
      {
        place: { ja: "500位ぴったり", en: "Exact 500th" },
        prize: {
          ja: "NBA Mega Mystery Box パック ×3",
          en: "NBA Mega Mystery Box pack ×3",
        },
      },
    ],
    footnote: {
      ja: "同点は最多得点者的中が多い人。賞品は登録メールでご連絡します。",
      en: "Ties go to whoever hit more top scorers. Prizes emailed.",
    },
    action: {
      label: {
        ja: "予想する",
        en: "Predict now",
      },
      route: "gamesHome",
    },
  },
];

/** event レイアウト用。EVENT 直下の名前。 */
export function whatsNewEventName(note: WhatsNewNote): UiStrings {
  return note.name ?? note.headline;
}

/** 起動シートのレイアウト。event は event、それ以外は案A。 */
export function whatsNewLaunchLayout(
  notes: readonly WhatsNewNote[]
): "a" | "event" {
  if (notes[0]?.kind === "event") return "event";
  return "a";
}

/**
 * 大量アップデートのモック。起動シートは要約1件だけ。
 * 各行はタップで該当画面へ。
 */
export const WHATS_NEW_BULK_UPDATE_BODY_LINES: readonly WhatsNewBodyLine[] = [
  {
    text: {
      ja: "的中の結果は、結果が出た日だけ届くようになりました。",
      en: "Hit results arrive only on days with a result.",
    },
    route: "resultHome",
  },
  {
    text: {
      ja: "連続予想は 3日・7日・30日を跨いだときだけ届きます。",
      en: "Streaks notify only when you cross 3, 7, or 30 days.",
    },
    route: "gamesHome",
  },
  {
    text: {
      ja: "試合が無い日の通知は送りません。",
      en: "No notification on days without a game.",
    },
    route: "notificationSettings",
  },
  {
    text: {
      ja: "通知設定から、受け取る種類を変えられます。",
      en: "You can change what you receive in notification settings.",
    },
    route: "notificationSettings",
  },
  {
    text: {
      ja: "欠場・Insight の直前アラートは Pro だけ届きます。",
      en: "Injury and Insight pre-tipoff alerts are Pro-only.",
    },
    route: "notificationSettings",
    proOnly: true,
  },
  {
    text: {
      ja: "そのほか表示の調整と細かい不具合修正を入れています。",
      en: "Plus display tweaks and small bug fixes.",
    },
  },
];

/** Free + proOnly → ゲート。それ以外は通常遷移。 */
export function whatsNewActionNeedsProGate(
  action: Pick<WhatsNewNoteAction, "proOnly">,
  isPro: boolean
): boolean {
  return Boolean(action.proOnly) && !isPro;
}

/** 本文行 → シートの onAction 用。route が無い行は null。 */
export function whatsNewActionFromBodyLine(
  line: WhatsNewBodyLine
): WhatsNewNoteAction | null {
  if (!line.route) return null;
  return {
    label: line.text,
    route: line.route,
    proOnly: line.proOnly,
  };
}

export const WHATS_NEW_BULK_UPDATE_MOCK_NOTES: readonly WhatsNewNote[] = [
  {
    id: "mock-bulk-update-2026-11",
    kind: "update",
    headline: {
      ja: "通知と連続予想を改善しました",
      en: "Notifications and streaks improved",
    },
    bodyLines: WHATS_NEW_BULK_UPDATE_BODY_LINES,
    action: {
      label: {
        ja: "詳しく見る",
        en: "See details",
      },
      route: "announcements",
    },
  },
];

/** 展開用の本文行。bodyLines 優先、無ければ body を改行分割（遷移なし）。 */
export function resolveWhatsNewBodyLines(
  note: WhatsNewNote | undefined
): readonly WhatsNewBodyLine[] {
  if (!note) return [];
  if (note.bodyLines && note.bodyLines.length > 0) return note.bodyLines;
  if (!note.body) return [];
  const ja = note.body.ja.split("\n").map((s) => s.trim()).filter(Boolean);
  const en = note.body.en.split("\n").map((s) => s.trim()).filter(Boolean);
  const n = Math.max(ja.length, en.length);
  const lines: WhatsNewBodyLine[] = [];
  for (let i = 0; i < n; i++) {
    lines.push({
      text: {
        ja: ja[i] ?? en[i] ?? "",
        en: en[i] ?? ja[i] ?? "",
      },
    });
  }
  return lines;
}

/** お知らせ画像の URI。相対パスは API base を付ける。 */
export function resolveWhatsNewImageUrl(
  imageUrl: string | undefined,
  apiBase: string | null | undefined
): string | null {
  const raw = (imageUrl ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) {
    const base = (apiBase ?? "").replace(/\/$/, "");
    if (!base) return null;
    return `${base}${raw}`;
  }
  return raw;
}

/**
 * シートの主ボタン。新機能を優先し、無ければ先頭の action。
 */
export function whatsNewSheetAction(
  notes: readonly WhatsNewNote[]
): WhatsNewNoteAction | null {
  const withAction = notes.filter((note) => note.action != null);
  if (withAction.length === 0) return null;
  const feature = withAction.find((note) => note.kind === "feature");
  return (feature ?? withAction[0]).action ?? null;
}

export function whatsNewSheetCopy(language: LocalizedLang | string): {
  title: string;
  close: string;
} {
  const lang = resolveLocalizedLang(language);
  return {
    title: L(lang, { ja: "お知らせ", en: "News" }),
    close: L(lang, { ja: "閉じる", en: "Close" }),
  };
}

/** 種別は言語に関わらず英語（シートの装飾ラベル）。 */
export function whatsNewKindLabel(
  _language: LocalizedLang | string,
  kind: WhatsNewKind
): string {
  if (kind === "update") return "UPDATE";
  if (kind === "feature") return "NEW";
  return "EVENT";
}
