// app/component/post/PredictionPostCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import cn from "clsx";
import type { League } from "@/app/component/games/MatchCard";
import { teamColorsJ1 } from "@/lib/teams-j1";
import { teamColorsB1 } from "@/lib/teams-b1";
import Jersey from "@/app/component/games/icons/jersey.svg";
import SoccerBadge from "@/app/component/games/icons/soccer-badge.svg";
import { Heart, Bookmark, Pencil, Trash2, X, Check, Clock } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { shortTeamName } from "@/lib/team-alias";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";
import { motion } from "framer-motion";

/** shortTeamName が string でも object でも安全に “表示用の短い文字列” を返す */
const shortLabel = (t: any): string => {
  const r = shortTeamName(t as any);
  if (typeof r === "string") return r;
  return r?.short ?? r?.name ?? String(t ?? "");
};

/* ===== util ===== */
function getPrimaryColor(league: League, teamName: string): string {
  if (league === "j") return teamColorsJ1[teamName]?.primary ?? "#ffffff";
  return teamColorsB1[teamName]?.primary ?? "#ffffff";
}

/* ===== types ===== */
type Outcome = "pending" | "hit" | "miss" | "void";
type LegKind = "main" | "secondary" | "tertiary";

export type PredictionLeg = {
  kind: LegKind;
  label: string;
  odds: number;
  pct: number; // 0-100
  outcome: Outcome;
};

export type PredictionPost = {
  id: string;
  author: { name: string; avatarUrl?: string } | undefined;
  createdAtText: string;
  gameId?: string;
  game?:
    | {
        league: League;
        home: string;
        away: string;
        status: "scheduled" | "live" | "final";
        finalScore?: { home: number; away: number };
      }
    | undefined;
  legs: PredictionLeg[];
  resultUnits?: number | null;
  note?: string;

  authorUid?: string | null;
  startAtMillis?: number | null;

  likeCount?: number;
  saveCount?: number;
  createdAtMillis?: number;
  updatedAtMillis?: number;
};

/* ===== テーマ色（ノブ共通色） ===== */
const THEME_KNOB_BG = "#0a3b47";

/* ===== バー色 ===== */
const LEG_STYLE: Record<
  LegKind,
  {
    barBase: string;
    barFill: string;
    knobBg: string;
    knobText: string;
    knobBorder: string;
  }
> = {
  main: {
    barBase: "bg-yellow-500/20",
    barFill: "bg-yellow-400",
    knobBg: "bg-[#0a3b47]",
    knobText: "text-white",
    knobBorder: "border-[#0a3b47]/70",
  },
  secondary: {
    barBase: "bg-purple-500/20",
    barFill: "bg-purple-400",
    knobBg: "bg-[#0a3b47]",
    knobText: "text-white",
    knobBorder: "border-[#0a3b47]/70",
  },
  tertiary: {
    barBase: "bg-rose-500/20",
    barFill: "bg-rose-400",
    knobBg: "bg-[#0a3b47]",
    knobText: "text-white",
    knobBorder: "border-[#0a3b47]/70",
  },
};

/* ステータス・ミニアイコン */
const OUTCOME_ICON_NODE: Record<Outcome, React.ReactNode | null> = {
  hit: <Check size={14} strokeWidth={3} />,
  miss: <X size={14} strokeWidth={3} />,
  pending: <Clock size={12} strokeWidth={3} />,
  void: null,
};
const OUTCOME_CLASS: Record<Outcome, string> = {
  hit: "text-yellow-300 drop-shadow",
  miss: "text-rose-400 drop-shadow",
  pending: "text-white/85 drop-shadow",
  void: "text-transparent",
};

/* ラベル整形 */
function stripLeadingTeam(label: string, candidates: string[]) {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const list = candidates.filter(Boolean).map(esc);
  if (!list.length) return label;
  const re = new RegExp(`^\\s*(?:${list.join("|")})[\\s・:：-]*`, "i");
  return label.replace(re, "").trim();
}

function resolveLegTeamAndText(label: string, home: string, away: string) {
  const safeLabel = String(label ?? "");
  const homeSafe = String(home ?? "");
  const awaySafe = String(away ?? "");
  const homeShort = shortLabel(homeSafe);
  const awayShort = shortLabel(awaySafe);

  const escapeRegExp = (s: string) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const contains = (t: string) =>
    !!t && new RegExp(escapeRegExp(t), "i").test(safeLabel);

  let chosen = homeSafe;
  if (contains(awaySafe) || contains(awayShort)) chosen = awaySafe;
  else if (contains(homeSafe) || contains(homeShort)) chosen = homeSafe;

  const chosenShort = shortLabel(chosen);
  const cleaned = stripLeadingTeam(safeLabel, [chosen, chosenShort]);
  return { chosenTeam: chosenShort, cleanedText: cleaned, chosenRaw: chosen };
}

/* ====== 本体 ====== */
export default function PredictionPostCard(props: {
  post?: PredictionPost;
  profileHref?: string;

  // ★ SearchTab から渡されるクリック挙動
  onClickHeader?: () => void;
  onClickBody?: () => void;
  mode?: "list" | "detail";
}) {
  const mode = props.mode ?? "list";
  const Wrapper: any = mode === "list" ? Link : "div";
  const post = props.post;
  const profileHref = props.profileHref;
  const router = useRouter();

  if (!post) return null;

  // Auth
  const [uid, setUid] = React.useState<string | null>(
    auth.currentUser?.uid ?? null
  );
  React.useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => off();
  }, []);

  // ===== 作者情報（名前 & アイコン） =====
  const initialAuthorName =
    post.author?.name ?? (post as any).authorDisplayName ?? "ユーザー";

  const initialAuthorAvatar =
    post.author?.avatarUrl ??
    (post as any).authorPhotoURL ??
    "/avatar-placeholder.png";

  const [authorName, setAuthorName] =
    React.useState<string>(initialAuthorName);
  const [authorAvatar, setAuthorAvatar] =
    React.useState<string>(initialAuthorAvatar);

  // 投稿が変わったときは初期値をリセット
  React.useEffect(() => {
    setAuthorName(initialAuthorName);
    setAuthorAvatar(initialAuthorAvatar);
  }, [initialAuthorName, initialAuthorAvatar, post.id]);

  // users/{uid} を購読して、最新の displayName / photoURL で上書き
  React.useEffect(() => {
    const u = post.authorUid;
    if (!u) return;

    const ref = doc(db, "users", u);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as any;

        const nextName =
          (typeof data.displayName === "string" &&
            data.displayName.trim().length > 0 &&
            data.displayName) ||
          (typeof data.username === "string" &&
            data.username.trim().length > 0 &&
            data.username) ||
          (typeof data.handle === "string" &&
            data.handle.trim().length > 0 &&
            data.handle) ||
          initialAuthorName;

        const nextPhoto =
          (typeof data.photoURL === "string" &&
            data.photoURL.trim().length > 0 &&
            data.photoURL) ||
          (typeof data.avatarUrl === "string" &&
            data.avatarUrl.trim().length > 0 &&
            data.avatarUrl) ||
          null;

        setAuthorName(nextName);
        if (nextPhoto) setAuthorAvatar(nextPhoto);
      },
      (err) => {
        console.error("users profile onSnapshot error:", err);
      }
    );

    return () => unsub();
  }, [post.authorUid, initialAuthorName]);

  // ===== likes / saves =====
  const [liked, setLiked] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState<number>(
    post.likeCount ?? 0
  );
  const [saveCount, setSaveCount] = React.useState<number>(
    post.saveCount ?? 0
  );

  React.useEffect(() => {
  // ログアウト状態なら Firestore rules により読めないので購読しない
  if (!uid) {
    setLiked(false);
    setSaved(false);
    return;
  }

  const likesQ = query(collection(db, "posts", post.id, "likes"));
  const unsubLikes = onSnapshot(
    likesQ,
    (snap) => {
      setLikeCount(snap.size);
      setLiked(snap.docs.some((d) => d.id === uid));
    },
    () => {} // permission-denied のログを防ぐ
  );

  const savesQ = query(collection(db, "posts", post.id, "saves"));
  const unsubSaves = onSnapshot(
    savesQ,
    (snap) => {
      setSaveCount(snap.size);
      setSaved(snap.docs.some((d) => d.id === uid));
    },
    () => {}
  );

  return () => {
    unsubLikes();
    unsubSaves();
  };
}, [post.id, uid]);


  // 編集/削除
  const isMine = !!(uid && post.authorUid && uid === post.authorUid);
  const locked =
    typeof post.startAtMillis === "number"
      ? Date.now() >= (post.startAtMillis as number)
      : false;

  const [editing, setEditing] = React.useState(false);
  const [draftNote, setDraftNote] = React.useState(post.note ?? "");
  const [busy, setBusy] = React.useState(false);

  const stop = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
  };
  const startEdit = (e?: React.MouseEvent) => {
    stop(e);
    setDraftNote(post.note ?? "");
    setEditing(true);
  };
  const cancelEdit = (e?: React.MouseEvent) => {
    stop(e);
    setEditing(false);
    setDraftNote(post.note ?? "");
  };
  const submitEdit = async (e?: React.MouseEvent) => {
    stop(e);
    if (!isMine || locked) return;
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    if (!token) return toast.error("ログインが必要です");
    try {
      setBusy(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: draftNote }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("投稿を更新しました");
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message ?? "更新に失敗しました");
    } finally {
      setBusy(false);
    }
  };
  const doDelete = async (e?: React.MouseEvent) => {
    stop(e);
    if (!isMine || locked) return;
    if (!confirm("この投稿を削除します。よろしいですか？")) return;
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    if (!token) return toast.error("ログインが必要です");
    try {
      setBusy(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("投稿を削除しました");
    } catch (e: any) {
      toast.error(e?.message ?? "削除に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  /* ========= 試合情報 ========= */
  const league: League = post.game?.league ?? "bj";

  const rawHome =
    (post as any).game?.home ??
    (post as any).home ??
    (post as any).gameHome ??
    "";
  const rawAway =
    (post as any).game?.away ??
    (post as any).away ??
    (post as any).gameAway ??
    "";

  const gameHome: string =
    typeof rawHome === "string" ? rawHome : rawHome?.name ?? "";
  const gameAway: string =
    typeof rawAway === "string" ? rawAway : rawAway?.name ?? "";

  const finalScoreRaw =
    (post as any)?.game?.finalScore ?? (post as any)?.finalScore ?? null;

  const finalScore =
    finalScoreRaw != null
      ? {
          home: Number((finalScoreRaw as any).home),
          away: Number((finalScoreRaw as any).away),
        }
      : null;

  const homeShort = shortLabel(gameHome) || gameHome;
  const awayShort = shortLabel(gameAway) || gameAway;
  const winnerShort =
    finalScore && Number.isFinite(finalScore.home) &&
    Number.isFinite(finalScore.away)
      ? finalScore.home > finalScore.away
        ? homeShort
        : awayShort
      : null;

  // likes/saves の書き込み
  const onToggleLike = async (e?: React.MouseEvent) => {
    stop(e);
    if (!uid) return toast.error("ログインが必要です");
    const ref = doc(db, "posts", post.id, "likes", uid);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) await deleteDoc(ref);
      else await setDoc(ref, { createdAt: new Date() });
    } catch {
      toast.error("通信エラーが発生しました");
    }
  };
  const onToggleSave = async (e?: React.MouseEvent) => {
    stop(e);
    if (!uid) return toast.error("ログインが必要です");
    const ref = doc(db, "posts", post.id, "saves", uid);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) await deleteDoc(ref);
      else await setDoc(ref, { createdAt: new Date(), uid });
    } catch {
      toast.error("通信エラーが発生しました");
    }
  };

  const elevate =
    post.resultUnits != null && post.resultUnits > 0
      ? "ring-2 ring-yellow-300/60 shadow-[0_0_12px_rgba(255,255,120,0.25)]"
      : post.resultUnits != null && post.resultUnits < 0
      ? "ring-2 ring-rose-400/40 shadow-[0_0_12px_rgba(255,0,80,0.25)]"
      : "ring-1 ring-white/10 shadow-md";

  // —— ヘッダー押下でプロフィールへ（親<Link>への伝播は先に止める）
  // —— ヘッダー押下でプロフィールへ（親<Link>への伝播は先に止める）
const goProfileCapture = (e: React.SyntheticEvent) => {
  if (!profileHref) return;

  // 🟢 修正版：普通に呼び出せば良い
  e.preventDefault();
  e.stopPropagation();

  router.push(profileHref);
};

  const onHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (!profileHref) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      router.push(profileHref);
    }
  };

return (
    <div className={cn("relative rounded-3xl p-1", elevate)}>
        <div className="rounded-2xl bg-gradient-to-b from-black/8 to-black/3">
          <div className="rounded-2xl bg-black/10 border border-white/10 p-3 md:p-6 text-white">
            {/* ヘッダー（ここを押すとプロフィールへ） */}
<Link
  href={profileHref ?? "#"}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    if (profileHref) router.push(profileHref);
  }}
  className="flex items-start gap-3 md:gap-4 cursor-pointer"
>
  {/* アバター */}
  <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full ring-4 ring-[#0f2d35] overflow-hidden">
    <img
      src={authorAvatar}
      alt=""
      className="w-full h-full object-cover"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  </div>

  {/* 名前＋日付＋HOME vs AWAY＋スコア */}
  <div className="min-w-0">

    {/* 名前＋日付 */}
    <div className="flex items-center gap-2 md:gap-3">
      <h3 className="text-[15px] md:text-[26px] font-extrabold truncate">
        {authorName}
      </h3>
      <span className="text-xs md:text-sm opacity-70 whitespace-nowrap">
        {post.createdAtText}
      </span>
    </div>

    {/* HOME vs AWAY（← ここに移動する） */}
    <Link
      href={
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 768px)").matches
          ? `/mobile/games/${post.gameId}/predictions`
          : `/web/games/${post.gameId}/predictions`
      }
      onClick={(e) => e.stopPropagation()}
      className="mt-1 flex flex-wrap items-baseline text-xs md:text-xl font-extrabold tracking-wide leading-tight"
    >
      <span className="truncate">{homeShort}</span>
      <span className="opacity-70 ml-1 whitespace-nowrap">vs</span>
      <span className="truncate">{awayShort}</span>
    </Link>

    {/* スコア（← これも同じくここ） */}
    {finalScore &&
      Number.isFinite(finalScore.home) &&
      Number.isFinite(finalScore.away) && (
        <div className="mt-0.5 text-[11px] md:text-sm opacity-90">
          {finalScore.home}–{finalScore.away}{" "}
          <span className="opacity-90">
            {winnerShort ?? "勝者"}勝利
          </span>
        </div>
      )}
      
  </div> {/* ← ここで閉じるのが正解 */}

</Link>

            {/* ===== レグ ===== */}
<div
  className="mt-4 md:mt-5 space-y-2.5 md:space-y-3"
  onClick={() => {
    if (mode === "list") {
      router.push(`/post/${post.id}`);
    }
  }}
>
              {post.legs.map((leg) => {
                const style = LEG_STYLE[leg.kind];
                const rawPct = Number.isFinite(leg.pct) ? leg.pct : 0;
                const pct = Math.max(0, Math.min(100, rawPct));
                const Icon = league === "j" ? SoccerBadge : Jersey;

                const { chosenTeam, cleanedText, chosenRaw } =
                  resolveLegTeamAndText(leg.label, gameHome, gameAway);
                const jerseyColor = getPrimaryColor(league, chosenRaw);

                const outcomeNode = OUTCOME_ICON_NODE[leg.outcome];
                const outcomeCls = OUTCOME_CLASS[leg.outcome];

                return (
                  <div
                    key={`${leg.kind}-${leg.label}`}
                    className="rounded-2xl border border-white/12 bg-black/15 p-2.5 md:p-3"
                  >
                    <div className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[52px_1fr_auto] gap-2.5 md:gap-3 items-center">
                      <div className="relative">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full ring-2 ring-white/15 bg-black/20 grid place-items-center overflow-hidden">
                          <Icon
                            className="w-9 h-9 md:w-11 md:h-11"
                            fill={jerseyColor}
                            stroke="#fff"
                          />
                        </div>
                        {outcomeNode && (
                          <div
                            className={cn(
                              "absolute -bottom-1 -right-1 h-4 w-4 md:h-5 md:w-5 grid place-items-center",
                              outcomeCls
                            )}
                          >
                            {outcomeNode}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-[14px] md:text-[15px] font-extrabold leading-tight truncate">
                          {chosenTeam}
                        </div>
                        <div className="text-[12px] md:text-sm opacity-90 leading-tight truncate">
                          {cleanedText}
                        </div>
                      </div>

                      <div className="ml-1.5 md:ml-2">
                        <div className="rounded-xl border border-white/15 bg-white/10 px-2 py-1.5 md:px-3 md:py-2 text-right">
                          <div className="text-sm md:text-base font-extrabold tabular-nums">
                            {leg.odds.toFixed(1)}
                          </div>
                          <div className="text-[10px] md:text-[11px] opacity-75 leading-none mt-0.5">
                            Odds
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 md:mt-3 relative">
                      <div
                        className={cn(
                          "h-2.5 md:h-3 w-full rounded-full overflow-hidden",
                          style.barBase
                        )}
                      >
                        <div
                          className={cn("h-full rounded-full", style.barFill)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div
                        className="absolute -top-2 -translate-x-1/2 md:-top-2.5"
                        style={{ left: `calc(${pct}% )` }}
                      >
                        <div
                          className={cn(
                            "px-2 md:px-3 h-6 md:h-7 min-w-[32px] md:min-w-[36px] rounded-full border shadow-sm grid place-items-center",
                            style.knobBg,
                            style.knobBorder
                          )}
                          style={{ backgroundColor: THEME_KNOB_BG }}
                        >
                          <span
                            className={cn(
                              "text-[11px] md:text-[12px] leading-none font-extrabold tabular-nums",
                              style.knobText
                            )}
                          >
                            {Math.round(pct)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 根拠（投稿詳細へのクリック領域） */}
<div
  className="mt-4 md:mt-5"
  onClick={() => {
    if (mode === "list") {
      router.push(`/post/${post.id}`);
    }
  }}
>
              {!editing ? (
                <p className="m-0 text-[14px] md:text-[16px] leading-relaxed">
                  {post.note || "（ユーザーが書き込んだ根拠…）"}
                </p>
              ) : (
                <textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl bg-white/8 border border-white/10 p-3 md:p-4 leading-relaxed text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="根拠を編集…"
                  disabled={busy}
                  onClick={stop}
                />
              )}
            </div>

            {/* アクション行 */}
            <div className="mt-3 md:mt-4 flex items-center justify-between">
              {/* ← 左：編集 / 削除（今のボタンそのまま） */}
  <div className="flex items-center gap-1.5 md:gap-2">
    {isMine && !locked && (
      !editing ? (
        <>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(e); }}
            disabled={busy}
            aria-label="編集"
          >
            <Pencil size={16} className="md:hidden" />
            <Pencil size={18} className="hidden md:block" />
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); doDelete(e); }}
            disabled={busy}
            aria-label="削除"
          >
            <Trash2 size={16} className="md:hidden" />
            <Trash2 size={18} className="hidden md:block" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-lg border border-emerald-300/40 bg-emerald-300/20 hover:bg-emerald-300/30"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); submitEdit(e); }}
            disabled={busy}
            aria-label="保存"
          >
            <Check size={16} className="md:hidden" />
            <Check size={18} className="hidden md:block" />
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancelEdit(e); }}
            disabled={busy}
            aria-label="キャンセル"
          >
            <X size={16} className="md:hidden" />
            <X size={18} className="hidden md:block" />
          </button>
        </>
      )
    )}
  </div>
             {/* -- 中央：いいね＋ブックマーク（固定セット） -- */}
  <div className="flex items-center gap-3 md:gap-4">
    {/* いいね */}
    <motion.button
      type="button"
      whileTap={{ scale: 1.25 }}
      transition={{ type: "spring", stiffness: 300, damping: 10 }}
      onClick={(e) => onToggleLike(e)}
      className="inline-flex items-center gap-1.5 md:gap-2 opacity-90"
      aria-pressed={liked}
      aria-label="いいね"
    >
      <Heart
        strokeWidth={2}
        className={cn(
          "w-5 h-5 md:w-[22px] md:h-[22px] transition-colors duration-200",
          liked ? "text-pink-400 fill-current" : "text-white"
        )}
      />
      <motion.span
        key={likeCount}
        initial={{ scale: 0.9, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-xs md:text-sm tabular-nums"
      >
        {likeCount}
      </motion.span>
    </motion.button>

    {/* ブックマーク */}
    <motion.button
      type="button"
      whileTap={{ scale: 1.25 }}
      transition={{ type: "spring", stiffness: 300, damping: 10 }}
      onClick={(e) => onToggleSave(e)}
      className="inline-flex items-center gap-1.5 md:gap-2 opacity-90"
      aria-pressed={saved}
      aria-label="保存"
    >
      <Bookmark
        strokeWidth={2}
        className={cn(
          "w-5 h-5 md:w-[22px] md:h-[22px] transition-colors duration-200",
          saved ? "text-emerald-400 fill-current" : "text-white"
        )}
      />
      <motion.span
        key={saveCount}
        initial={{ scale: 0.9, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-xs md:text-sm tabular-nums"
      >
        {saveCount}
      </motion.span>
    </motion.button>
  </div>

              {typeof post.resultUnits === "number" ? (
  post.resultUnits > 0 ? (
    /* +unit（勝ち） */
    <div
      className={cn(
        "relative overflow-hidden inline-flex items-center gap-1.5 md:gap-2 rounded-2xl px-3 py-1.5 md:px-3.5 md:py-2 border",
        "shadow-[inset_0_2px_6px_rgba(255,255,255,0.35),inset_0_-3px_8px_rgba(0,0,0,0.20)]",
        "ring-1 ring-white/15",
        "bg-lime-400 text-black border-white/15 shadow-[0_0_24px_rgba(163,230,53,.45)]",
        "font-extrabold"
      )}
    >
      <span className="text-sm md:text-lg tabular-nums">
        +{post.resultUnits.toFixed(2)}{" "}
        <span className="text-xs md:text-sm">unit</span>
      </span>
    </div>
  ) : post.resultUnits < 0 ? (
    /* -unit（負け） */
    <div
      className={cn(
        "relative overflow-hidden inline-flex items-center gap-1.5 md:gap-2 rounded-2xl px-3 py-1.5 md:px-3.5 md:py-2 border",
        "shadow-[inset_0_2px_6px_rgba(255,255,255,0.18),inset_0_-3px_8px_rgba(0,0,0,0.15)]",
        "ring-1 ring-white/10",
        "bg-white/10 text-white/70 border-white/15",
        "font-extrabold"
      )}
    >
      <span className="text-sm md:text-lg tabular-nums">
        {post.resultUnits.toFixed(2)}{" "}
        <span className="text-xs md:text-sm">unit</span>
      </span>
    </div>
  ) : (
    /* 0 なら void */
    <div
      className={cn(
        "relative overflow-hidden inline-flex items-center gap-1.5 md:gap-2 rounded-2xl px-3 py-1.5 md:px-3.5 md:py-2 border",
        "ring-1 ring-white/10",
        "bg-white/15 text-white/85 border-white/20",
        "italic font-semibold"
      )}
    >
      <span className="text-sm md:text-lg">void</span>
    </div>
  )
) : null}

            </div>
          </div>
        </div>
      </div>
  );
}


