// app/component/games/TrendUsersSection.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { fetchTrendUsers, type TrendUser } from "@/lib/trend";
import TrendUserCard from "@/app/component/games/TrendUserCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { title?: string };

export default function TrendUsersSection({ title = "注目ユーザー" }: Props) {
  const pathname = usePathname();
  const basePath: "/web" | "/mobile" =
    pathname?.startsWith("/mobile") ? "/mobile" : "/web";

  const [users, setUsers] = React.useState<TrendUser[] | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const [isMdUp, setIsMdUp] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsMdUp(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const visibleCount = isMdUp ? 4.3 : 2.6;

  React.useEffect(() => {
    (async () => {
      const u = await fetchTrendUsers(12);

      // ★ 連勝中(currentStreak)でソート
      const sorted = [...u].sort(
        (a, b) => b.currentStreak - a.currentStreak
      );

      setUsers(sorted.slice(0, 12));
    })();
  }, []);

  const scrollByOne = (dir: -1 | 1) => {
    const el = listRef.current;
    if (!el) return;
    const itemW = el.clientWidth / visibleCount;
    el.scrollBy({ left: dir * Math.round(itemW), behavior: "smooth" });
  };

  const [page, setPage] = React.useState(0);
  const totalPages =
    users && users.length > 0
      ? Math.max(1, users.length - Math.floor(visibleCount) + 1)
      : 1;

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const itemW = el.clientWidth / visibleCount;
      const idx = Math.round(el.scrollLeft / itemW);
      const clamped = Math.min(Math.max(idx, 0), totalPages - 1);
      setPage(clamped);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [visibleCount, totalPages]);

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">

        {isMdUp && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="左へ"
              onClick={() => scrollByOne(-1)}
              className="rounded-full border border-white/15 bg-white/10 p-1.5 text-white hover:bg-white/15"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="右へ"
              onClick={() => scrollByOne(1)}
              className="rounded-full border border-white/15 bg-white/10 p-1.5 text-white hover:bg-white/15"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          ref={listRef}
          role="list"
          aria-label="注目ユーザー一覧"
          className="
            flex gap-1 md:gap-3 overflow-x-auto snap-x snap-mandatory
            px-3 md:px-4 py-1
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          style={{ scrollBehavior: "smooth" }}
        >
          {users === null &&
            Array.from({ length: isMdUp ? 5 : 3 }).map((_, i) => (
              <SkeletonCard key={`sk-${i}`} />
            ))}

          {users !== null && users.length === 0 && <EmptyStrip />}

          {users !== null &&
            users.length > 0 &&
            users.map((u) => {
              const href = `${basePath}/u/${u.handle ?? u.uid}`;

              return (
                <div
                  key={u.uid}
                  role="listitem"
                  aria-label={u.displayName}
                  className="
                    shrink-0 grow-0
                    basis-[calc(100%/2.6)] md:basis-[calc(100%/4.3)]
                    snap-start
                  "
                >
                  <TrendUserCard
                    uid={u.uid}
                    href={href}
                    photoURL={u.photoURL}
                    displayName={u.displayName}
                    streak={u.currentStreak} // ← ★ V2 正式対応
                    hot={true}
                  />
                </div>
              );
            })}
        </div>
      </div>

      {users !== null && users.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5 md:gap-2">
          {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => (
            <span
              key={i}
              aria-current={i === page ? "true" : "false"}
              className={
                "h-1.5 w-1.5 md:h-2 md:w-2 rounded-full " +
                (i === page ? "bg-white/90" : "bg-white/30")
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* --- Skeleton & Empty --- */
function SkeletonCard() {
  return (
    <div
      className="
        shrink-0 grow-0
        basis-[calc(100%/2.6)] md:basis-[calc(100%/4.3)]
        snap-start
      "
    >
      <div className="min-h-[190px] md:minh-[260px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <div className="space-y-4 p-5 md:p-6">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-4 w-36 rounded bg-white/10" />
          <div className="h-10 w-28 rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function EmptyStrip() {
  return (
    <div
      className="
        shrink-0 grow-0
        basis-[calc(100%/2.6)] md:basis-[calc(100%/4.3)]
        snap-start
      "
    >
      <div className="grid min-h-[190px] md:minh-[260px] place-items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur text-white/60">
        直近の連勝中ユーザーはまだいません
      </div>
    </div>
  );
}
