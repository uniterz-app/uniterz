// app/component/common/FollowButton.tsx
"use client";

import React from "react";
import { auth } from "@/lib/firebase";
import { getIsFollowing, toggleFollow } from "@/lib/follow";
import { toast } from "sonner";
import LoginRequiredModal from "@/app/component/modals/LoginRequiredModal"; // ★追加

type Props = {
  targetUid: string;
  size?: "sm" | "md";
  variant?: "blue" | "lime";
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
  const [showLoginRequired, setShowLoginRequired] = React.useState(false); // ★追加

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

  const clsBase =
    size === "sm"
      ? "h-9 px-3 rounded-lg text-xs font-bold active:scale-90 transition-transform"
      : "h-10 px-4 rounded-xl text-sm font-bold transition";

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
    e.stopPropagation();

    // ★ 未ログイン時はモーダル
    if (!auth.currentUser) {
      setShowLoginRequired(true);
      return;
    }

    try {
      setLoading(true);
      setFollowing((prev) => !prev);
      const res = await toggleFollow(targetUid);
      setFollowing(res.following);
      onChanged?.(res.following);
      toast.success(res.following ? "フォローしました" : "フォローを解除しました");
    } catch (e: any) {
      setFollowing((prev) => !prev);
      toast.error(e?.message ?? "操作に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className={`${clsBase} ${cls}`}
      >
        {following ? "フォロー中" : "フォロー"}
      </button>

      {/* ★ 追加 */}
      <LoginRequiredModal
        open={showLoginRequired}
        onClose={() => setShowLoginRequired(false)}
        variant="mobile"
      />
    </>
  );
}
