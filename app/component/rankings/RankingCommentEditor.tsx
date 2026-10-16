"use client";

/**
 * PRO LEAGUE — 自分のひとことの表示・編集バー（TODAY / ランキング一覧の上）
 * Native `RankingCommentEditorNative` 相当
 */
import { useEffect, useMemo, useState } from "react";
import { jp, nameOxanium } from "@/lib/fonts";
import {
  fetchMeRankingComment,
  saveMeRankingComment,
} from "@/lib/api/meRankingComment";
import {
  RANKING_COMMENT_MAX_CHARS,
  normalizeRankingComment,
  rankingCommentCopy,
  rankingCommentLength,
  validateRankingComment,
} from "@/lib/rankings/rankingComment";

type Props = {
  language: string;
  /** 保存後の自分のひとこと（空 = 削除）。行の即時反映用 */
  onSaved?: (comment: string) => void;
};

export default function RankingCommentEditor({ language, onSaved }: Props) {
  const copy = useMemo(() => rankingCommentCopy(language), [language]);
  const [loaded, setLoaded] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMeRankingComment()
      .then((r) => {
        if (!alive) return;
        setIsPro(r.isPro);
        setComment(r.comment);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded || !isPro) return null;

  const draftLength = rankingCommentLength(normalizeRankingComment(draft));
  const overLimit = draftLength > RANKING_COMMENT_MAX_CHARS;

  async function save() {
    const next = normalizeRankingComment(draft);
    const invalid = validateRankingComment(next);
    if (invalid) {
      setError(copy.error(invalid));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await saveMeRankingComment(next);
      setComment(saved);
      setEditing(false);
      onSaved?.(saved);
    } catch (e) {
      setError(copy.error(e instanceof Error ? e.message : null));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              autoFocus
              placeholder={copy.placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy && !overLimit) void save();
              }}
              className={`${jp.className} min-w-0 flex-1 rounded border border-white/15 bg-black/40 px-2 py-1.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-[#00F5FF]/60`}
            />
            <span
              className={`${nameOxanium.className} shrink-0 text-[10px] tabular-nums ${overLimit ? "text-rose-300" : "text-white/40"}`}
            >
              {draftLength}/{RANKING_COMMENT_MAX_CHARS}
            </span>
          </div>
          <p className="text-[10px] leading-4 text-white/45">{copy.note}</p>
          {error ? (
            <p className="text-[11px] leading-4 text-rose-300">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="rounded px-3 py-1 text-[12px] text-white/60 active:opacity-70"
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              disabled={busy || overLimit}
              onClick={() => void save()}
              className="rounded bg-[#00F5FF] px-3 py-1 text-[12px] font-bold text-[#050508] disabled:opacity-40"
            >
              {copy.save}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(comment);
            setError(null);
            setEditing(true);
          }}
          className="flex w-full min-w-0 items-center gap-2 text-left active:opacity-75"
        >
          <span
            className={`${nameOxanium.className} shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#00F5FF]/80`}
          >
            {copy.label}
          </span>
          <span
            className={`${jp.className} min-w-0 flex-1 truncate text-[12px] ${comment ? "text-white/85" : "text-white/40"}`}
          >
            {comment || copy.emptyPrompt}
          </span>
          <span className="shrink-0 text-[11px] text-white/50 underline-offset-2">
            {copy.edit}
          </span>
        </button>
      )}
    </div>
  );
}
