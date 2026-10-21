"use client";

/** UNITERZ AI チャット（アプリの使い方 + NBA スタッツ。Native `NbaAskScreenNative` 相当） */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SendHorizontal } from "lucide-react";
import cn from "clsx";
import { auth } from "@/lib/firebase";
import { nameOxanium } from "@/lib/fonts";
import { nbaAskCopy } from "@/lib/nba/ask/nbaAskCopy";
import {
  fetchNbaAskStatus,
  postNbaAsk,
  type NbaAskStatus,
  type NbaAskTurnClient,
} from "@/lib/nba/ask/nbaAskClient";
import { splitNbaAskLinks } from "@/lib/nba/ask/nbaAskLinkify";
import {
  nbaAskDestinationLabel,
  nbaAskDestinationWebPath,
} from "@/lib/nba/ask/nbaAskDestinations";

const MAX_QUESTION_CHARS = 300;

type Props = {
  language: string;
  timeZone: string;
  signedIn: boolean;
};

export default function NbaAskChat({ language, timeZone, signedIn }: Props) {
  const router = useRouter();
  const copy = nbaAskCopy(language);
  const [turns, setTurns] = useState<NbaAskTurnClient[]>([]);
  const [status, setStatus] = useState<NbaAskStatus | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void (async () => {
      const user = auth.currentUser;
      if (!user) return;
      const next = await fetchNbaAskStatus({ token: await user.getIdToken() });
      if (!cancelled && next) setStatus(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy, notice]);

  const unavailable = status != null && !status.available;
  /** 無料のスタッツ枠を使い切った（アプリの質問は続けられる） */
  const statsUsedUp = status != null && status.statsFreeRemaining === 0;
  const canSend = draft.trim().length > 0 && !busy && !unavailable;

  async function send(raw: string) {
    const question = raw.trim().slice(0, MAX_QUESTION_CHARS);
    if (!question || busy || unavailable) return;
    const user = auth.currentUser;
    if (!user) {
      setNotice(copy.signIn);
      return;
    }
    const next: NbaAskTurnClient[] = [...turns, { role: "user", content: question }];
    setTurns(next);
    setDraft("");
    setNotice(null);
    setBusy(true);
    const result = await postNbaAsk({
      token: await user.getIdToken(),
      turns: next,
      language,
      timeZone,
    });
    setBusy(false);
    if (result.ok) {
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, opens: result.opens },
      ]);
      setStatus((prev) =>
        prev ? { ...prev, statsFreeRemaining: result.statsFreeRemaining } : prev
      );
      return;
    }
    // 送れなかった質問は入力欄に戻す（打ち直さなくていいように）
    setTurns(turns);
    setDraft(question);
    if (result.error === "unavailable") {
      setStatus((prev) => (prev ? { ...prev, available: false } : prev));
    } else if (result.error === "rate_limited") {
      setNotice(copy.rateLimited);
    } else if (result.error === "slow_down") {
      setNotice(copy.slowDown);
    } else if (result.error === "auth") {
      setNotice(copy.signIn);
    } else {
      setNotice(copy.failed);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
      <div className="flex-1 space-y-2.5 pb-4">
        {unavailable ? (
          <p className="text-[15px] font-semibold leading-snug text-white/92">{copy.unavailable}</p>
        ) : turns.length === 0 ? (
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-[15px] leading-[1.55] text-white/82">{copy.intro}</p>
            <div className="flex flex-wrap gap-2">
              {copy.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(s)}
                  className="border border-white/25 px-3 py-2 text-left text-[13px] text-white/92 hover:border-white/50 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((t, i) => {
          const mine = t.role === "user";
          return (
            <div key={i} className={cn("flex max-w-[84%] flex-col gap-2", mine ? "ml-auto items-end" : "mr-auto")}>
              <div
                className={cn(
                  "whitespace-pre-wrap px-3.5 py-2.5 text-[15px] leading-[1.5]",
                  mine ? "bg-[#00F5FF] text-[#041014]" : "bg-white/[0.06] text-white/94",
                )}
              >
                {splitNbaAskLinks(t.content).map((part, j) =>
                  part.kind === "link" ? (
                    <a
                      key={j}
                      href={part.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("underline", mine ? "text-[#041014]" : "text-[#00F5FF]")}
                    >
                      {part.url}
                    </a>
                  ) : (
                    <span key={j}>{part.text}</span>
                  )
                )}
              </div>
              {t.role === "assistant"
                ? t.opens?.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => router.push(nbaAskDestinationWebPath(id))}
                      className={`${nameOxanium.className} self-start bg-[#00F5FF] px-3 py-2 text-[12px] font-bold tracking-[0.06em] text-[#050508] hover:opacity-90`}
                    >
                      {nbaAskDestinationLabel(id, language)}
                    </button>
                  ))
                : null}
            </div>
          );
        })}

        {busy ? (
          <div className="mr-auto flex items-center gap-2 bg-white/[0.06] px-3.5 py-2.5" role="status">
            <Loader2 className="h-4 w-4 animate-spin text-[#00F5FF] motion-reduce:animate-none" aria-hidden />
            <span className="text-[13px] text-white/70">{copy.thinking}</span>
          </div>
        ) : null}

        {notice ? (
          <p className="py-3 text-center text-[13px] text-white/72" role="status">
            {notice}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      {!unavailable ? (
        <form
          className="sticky bottom-[var(--bottom-nav-clearance)] z-10 -mx-1 space-y-2 bg-[#05080e] px-1 pb-2 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          {statsUsedUp ? (
            <div className="flex items-center gap-2.5">
              <p className="flex-1 text-[11px] leading-snug text-white/72">{copy.statsUsedUp}</p>
              <button
                type="button"
                onClick={() => router.push("/mobile/pro/subscribe")}
                className={`${nameOxanium.className} min-h-9 shrink-0 bg-[#00F5FF] px-3.5 text-[12px] font-bold tracking-[0.08em] text-[#050508] hover:opacity-90`}
              >
                {copy.proCta}
              </button>
            </div>
          ) : status?.statsFreeRemaining != null ? (
            <p className="text-[11px] leading-snug text-white/45">
              {copy.statsFreeRemaining(status.statsFreeRemaining)}
            </p>
          ) : null}
          <div className="flex items-end bg-white/[0.06]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              placeholder={copy.placeholder}
              maxLength={MAX_QUESTION_CHARS}
              rows={1}
              aria-label={copy.open}
              className="max-h-28 min-h-[46px] flex-1 resize-none bg-transparent px-3.5 py-3 text-[16px] text-white outline-none placeholder:text-white/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={copy.send}
              className={cn(
                "flex h-[46px] w-[46px] shrink-0 items-center justify-center",
                canSend ? "bg-[#00F5FF] text-[#050508] hover:opacity-90" : "bg-white/10 text-white/35",
              )}
            >
              <SendHorizontal className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
