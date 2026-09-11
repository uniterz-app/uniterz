"use client";

/**
 * モバイル Web ユーザー検索（Native UserSearch 相当）。
 * MARK は Native 主戦場のため、Web は検索＋プロフィール遷移。
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { userSearchCopy } from "@/lib/users/userSearchCopy";
import type { UserSearchHit } from "@/lib/users/searchUsersByHandle";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";

const DEBOUNCE_MS = 320;

export default function UserSearchPage() {
  const router = useRouter();
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid);
  const copy = userSearchCopy(language);

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<UserSearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = query.trim().replace(/^@+/, "");
  const canSearch = trimmed.length >= 2;

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setSearched(false);
      setBusy(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError(null);
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error("login");
          const token = await user.getIdToken();
          const qs = new URLSearchParams({ q: trimmed });
          const res = await fetch(`/api/users/search?${qs}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = (await res.json().catch(() => ({}))) as {
            users?: UserSearchHit[];
            error?: string;
          };
          if (!res.ok) throw new Error(data.error || "fail");
          if (cancelled) return;
          setResults(Array.isArray(data.users) ? data.users : []);
          setSearched(true);
        } catch {
          if (cancelled) return;
          setResults([]);
          setSearched(true);
          setError(copy.failed);
        } finally {
          if (!cancelled) setBusy(false);
        }
      })();
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [canSearch, copy.failed, trimmed]);

  const status = useMemo(() => {
    if (!canSearch) return copy.hint;
    if (busy) return copy.searching;
    if (error) return error;
    if (searched && results.length === 0) return copy.empty;
    return null;
  }, [busy, canSearch, copy, error, results.length, searched]);

  return (
    <div className="relative min-h-[100dvh] bg-[#070708] text-white">
      <FloatingCloseButton />
      <div className="mx-auto max-w-lg px-4 pb-16 pt-16">
        <p className="mb-1 font-mono text-[10px] tracking-[0.22em] text-cyan-300/70">
          MARK
        </p>
        <h1 className="mb-5 text-lg font-bold tracking-wide text-cyan-100">
          {copy.title}
        </h1>

        <label className="flex items-center gap-2 border border-cyan-300/30 bg-black/50 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-cyan-300/80" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.placeholder}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-white/40"
              aria-label="clear"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>

        {status ? (
          <p className="mt-3 text-xs font-semibold text-white/65">{status}</p>
        ) : null}

        <ul className="mt-4 flex flex-col gap-2">
          {results.map((hit) => (
            <li key={hit.uid}>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/mobile/u/${encodeURIComponent(hit.handle)}`
                  )
                }
                className="flex w-full items-center gap-3 border border-white/85 px-3 py-2.5 text-left transition hover:bg-white/5"
              >
                {hit.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hit.photoURL}
                    alt=""
                    className="h-9 w-9 rounded-sm border border-white/15 object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/15 bg-white/10 text-xs font-bold text-cyan-200">
                    {(hit.displayName || hit.handle || "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-cyan-300">
                    {hit.displayName}
                    {hit.plan === "pro" ? (
                      <span className="ml-1 text-[9px] text-amber-300">
                        PRO
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-white/50">
                    @{hit.handle}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
