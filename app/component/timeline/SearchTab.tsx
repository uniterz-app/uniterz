"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import FollowButton from "@/app/component/common/FollowButton";

/* ============================
   型
   ============================ */
type UserHit = {
  id: string;
  displayName: string;
  handle: string;
  photoURL?: string | null;
};

/* ============================
   shellBase 判定
   ============================ */
function resolveShellBase(pathname: string): "/web" | "/mobile" {
  return pathname.startsWith("/mobile") ? "/mobile" : "/web";
}

export default function SearchTab() {
  const router = useRouter();
  const pathname = usePathname();
  const shellBase = resolveShellBase(pathname);

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserHit[]>([]);

  const debounced = useDebounce(q, 300);
  const canSearch = debounced.trim().length >= 2;

  /* ============================
     /api/search → ユーザーのみ取得
     ============================ */
  useEffect(() => {
    if (!canSearch) {
      setUsers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`);
        const json = await res.json();

        if (!cancelled) {
          setUsers(json.users ?? []);
        }
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced, canSearch]);

  return (
    <div className="text-white">
      {/* ===== 検索バー ===== */}
      <div className="sticky top-0 z-10 bg-[var(--color-app-bg,#0b2227)]/85 backdrop-blur">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ユーザーを検索"
              className="w-full h-11 rounded-2xl pl-10 pr-10 bg-white/10 border border-white/10 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />

            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {canSearch && (
          <h3 className="text-sm text-white/60">ユーザー</h3>
        )}

        {!loading && users.length === 0 && canSearch && (
          <p className="text-white/60 text-sm">一致するユーザーはいません。</p>
        )}

        {!loading && users.length > 0 && (
          <ul className="space-y-3">
            {users.map((u) => {
              const profileHref = `${shellBase}/u/${encodeURIComponent(u.handle)}`;

              return (
                <li
                  key={u.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  {/* アイコンを押したら → プロフィール遷移 */}
                  <div
                    className="cursor-pointer"
                    onClick={() => router.push(profileHref)}
                  >
                    <img
                      src={u.photoURL ?? "/avatar-placeholder.png"}
                      alt={u.displayName}
                      className="h-12 w-12 rounded-full object-cover bg-white/10"
                    />
                  </div>

                  {/* 名前を押したら → プロフィール遷移 */}
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => router.push(profileHref)}
                  >
                    <div className="font-extrabold text-[18px]">
                      {u.displayName}
                    </div>
                    <div className="text-white/70 text-sm">@{u.handle}</div>
                  </div>

                  {/* ---- 🔵 FollowButton ---- */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <FollowButton
                      targetUid={u.id}
                      size="sm"
                      variant="blue"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ===== debounce ===== */
function useDebounce<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setV(value), delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delay]);

  return v;
}
