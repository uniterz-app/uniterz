"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";

type Props = {
  targetUid: string;
  initialTab?: "followers" | "following";
  open: boolean;
  onClose: () => void;
};

type Row = {
  uid: string;
  createdAt?: Date | null;
  displayName: string;
  handle: string;
  avatarUrl?: string | null;
};

function toDateSafe(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v?.toDate === "function") return v.toDate();
  return null;
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.max(0, Math.floor(diff / 60000));
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const dd = Math.floor(h / 24);
  return `${dd}日前`;
}

/** 現在のパスから Web/Mobile のプレフィックスを判定 */
function useSectionPrefix() {
  const pathname = usePathname();
  // 既存のモバイル構成は /m/(with-nav)/... を想定
  if (pathname?.startsWith("/m/")) return "/m/(with-nav)";
  // 予備互換（もし /mobile を使う構成があるなら）
  if (pathname?.startsWith("/mobile")) return "/mobile";
  // それ以外は Web
  return "/web";
}

export default function FollowListDialog({
  targetUid,
  initialTab = "followers",
  open,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"followers" | "following">(initialTab);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const prefix = useSectionPrefix();

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open || !targetUid) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const sub = tab === "followers" ? "followers" : "following";
        const qref = query(
          collection(db, "users", targetUid, sub),
          orderBy("createdAt", "desc"),
          limit(50)
        );

        const snaps = await getDocs(qref);

        const ids = snaps.docs.map((d) => d.id);

        const users = await Promise.all(
          ids.map(async (uid) => {
            const us = await getDoc(doc(db, "users", uid));
            const data = us.data() as any | undefined;
            const createdAtRaw = snaps.docs.find((x) => x.id === uid)?.data() as any;

            return {
              uid,
              displayName: String(data?.displayName ?? ""),
              handle: String(data?.handle ?? ""),
              avatarUrl: data?.photoURL ?? data?.avatarUrl ?? null,
              createdAt: toDateSafe(createdAtRaw?.createdAt),
            } as Row;
          })
        );

        if (!cancelled) {
          setRows(users.filter((u) => (u.handle && u.handle.trim()) || (u.displayName && u.displayName.trim())));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "読み取りに失敗しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, targetUid, tab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/50">
      <div className="w-full md:max-w-[560px] md:rounded-2xl md:overflow-hidden bg-[var(--color-app-bg,#0b2227)] border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex gap-2">
            <button
              className={[
                "h-9 px-3 rounded-lg text-sm font-bold",
                tab === "followers" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/15",
              ].join(" ")}
              onClick={() => setTab("followers")}
            >
              フォロワー
            </button>
            <button
              className={[
                "h-9 px-3 rounded-lg text-sm font-bold",
                tab === "following" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/15",
              ].join(" ")}
              onClick={() => setTab("following")}
            >
              フォロー中
            </button>
          </div>
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white"
          >
            閉じる
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-3">
          {loading && <p className="text-white/70 text-sm px-1 py-2">読み込み中…</p>}
          {!loading && error && <p className="text-rose-300 text-sm px-1 py-2">{error}</p>}
          {!loading && !error && rows.length === 0 && (
            <p className="text-white/70 text-sm px-1 py-2">まだ誰もいません。</p>
          )}

          {!loading && !error && rows.length > 0 && (
            <ul className="space-y-2">
              {rows.map((u) => (
                <li key={u.uid}>
                  <Link
                    // ここがポイント：現在のセクションに合わせて /web or /m に分岐
                    href={`${prefix}/u/${encodeURIComponent(u.handle)}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                    onClick={onClose}
                  >
                    <div className="h-10 w-10 rounded-full bg-white/10 overflow-hidden">
  {u.avatarUrl ? (
    <img
      src={u.avatarUrl}
      alt=""
      className="w-full h-full object-cover"
      onError={(e) => {
        const t = e.currentTarget as HTMLImageElement;
        t.style.display = "none"; // 壊れた画像は非表示にする
      }}
    />
  ) : null}
</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate text-white">{u.displayName}</div>
                      <div className="text-white/70 text-sm truncate">@{u.handle}</div>
                    </div>
                    <div className="text-xs text-white/60">
                      {u.createdAt ? timeAgo(u.createdAt) : ""}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

