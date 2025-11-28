// app/component/common/FollowButton.tsx
"use client";

import React from "react";
import { auth } from "@/lib/firebase";
import { getIsFollowing, toggleFollow } from "@/lib/follow";
import { toast } from "sonner";

type Props = {
  targetUid: string;
  size?: "sm" | "md";
  variant?: "blue" | "lime";   // 色
  onChanged?: (following: boolean) => void;
};

export default function FollowButton({
  targetUid,
  size = "sm",
  variant = "blue",
  onChanged,
}: Props) {
  const me = auth.currentUser;
  const isMe = !!me && me.uid === targetUid;

  const [loading, setLoading] = React.useState(false);
  const [following, setFollowing] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    if (!targetUid || isMe) return;
    getIsFollowing(targetUid).then((v) => {
      if (alive) setFollowing(v);
    });
    return () => {
      alive = false;
    };
  }, [targetUid, isMe]);

  if (isMe) return null;

  // ▼ 高さ・角丸・フォントサイズ（両状態で完全一致）
  const clsBase =
    size === "sm"
      ? "h-9 px-3 rounded-lg text-xs font-bold transition"
      : "h-10 px-4 rounded-xl text-sm font-bold transition";

  // ▼ 色テーマ（両状態とも border を持たせてサイズを揃える）
  const theme =
    variant === "blue"
      ? {
          on:  "bg-white/10 text-white border border-white/20 hover:bg-white/15",
          off: "bg-sky-500 text-white border border-transparent hover:bg-sky-400",
        }
      : {
          on:  "bg-white/10 text-white border border-white/20 hover:bg-white/15",
          off: "bg-lime-400 text-white border border-transparent hover:bg-lime-300",
        };

  const cls = following ? theme.on : theme.off;

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 親カードのクリック遷移を無効化
    if (!auth.currentUser) return toast.error("ログインが必要です");
    try {
      setLoading(true);
      setFollowing((prev) => !prev); // 楽観更新
      const res = await toggleFollow(targetUid);
      setFollowing(res.following);
      onChanged?.(res.following);
      toast.success(res.following ? "フォローしました" : "フォローを解除しました");
    } catch (e: any) {
      setFollowing((prev) => !prev); // ロールバック
      toast.error(e?.message ?? "操作に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`${clsBase} ${cls}`}
    >
      {following ? "フォロー中" : "フォロー"}
    </button>
  );
}
