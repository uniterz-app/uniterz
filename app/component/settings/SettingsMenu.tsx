// app/component/settings/SettingsMenu.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import cn from "clsx";
import {
  User,
  Bookmark,
  Bell,
  Megaphone,
  FilePlus2,
  Package,
  HelpCircle,
  LogOut,
  Settings,
  LayoutDashboard,
  Newspaper,
  PlusSquare,
  Database,
  CheckCheck,
  Key,
  FileText,
  Users,
  Mail,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { ADMIN_UID } from "@/lib/constants";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import LogoutConfirmModal from "../modals/LogoutConfirmModal";

type Variant = "mobile" | "web";
type SettingsMenuProps = { variant?: Variant; className?: string };

export default function SettingsMenu({
  variant = "mobile",
  className,
}: SettingsMenuProps) {
  const isMobile = variant === "mobile";
  const router = useRouter();

  // ===== ログアウトモーダル =====
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ===== プラン機能の案内モーダル =====
  const [showPlanInfoModal, setShowPlanInfoModal] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      const redirectPath = isMobile ? "/mobile/login" : "/web/login";
      router.push(redirectPath);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const profileEditPath =
    variant === "web" ? "/web/settings/profile" : "/mobile/settings/profile";
  const bookmarksPath =
    variant === "web" ? "/web/bookmarks" : "/mobile/bookmarks";
  const announcementsPath =
    variant === "web" ? "/web/announcements" : "/mobile/announcements";
  const resetPath =
    variant === "web"
      ? "/web/settings/password"
      : "/mobile/settings/password";
  const helpPath = variant === "web" ? "/web/help" : "/mobile/help";

  const termsPath = variant === "web" ? "/web/terms" : "/mobile/terms";
  const privacyPath = variant === "web" ? "/web/privacy" : "/mobile/privacy";
  const guidelinesPath =
    variant === "web"
      ? "/web/community-guidelines"
      : "/mobile/community-guidelines";

  const contactPath =
    variant === "web" ? "/web/contact" : "/mobile/contact";

  // ===== 未読数（お知らせ） =====
  const { fUser: user, status } = useFirebaseUser();
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status !== "ready" || !user?.uid) return;
    const q = query(
      collection(db, "announcements"),
      where("visible", "==", true),
      orderBy("pinned", "desc"),
      orderBy("postedAt", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      const s = new Set<string>();
      snap.forEach((d) => s.add(d.id));
      setVisibleIds(s);
    });
    return () => unsub();
  }, [status, user?.uid]);

  useEffect(() => {
    if (status !== "ready" || !user?.uid) {
      setReadIds(new Set());
      return;
    }
    const col = collection(db, `users/${user.uid}/reads`);
    const unsub = onSnapshot(col, (snap) => {
      const s = new Set<string>();
      snap.forEach((d) => s.add(d.id));
      setReadIds(s);
    });
    return () => unsub();
  }, [status, user?.uid]);

  const unreadCount = useMemo(() => {
    if (status !== "ready" || !user?.uid) return 0;
    let cnt = 0;
    visibleIds.forEach((id) => {
      if (!readIds.has(id)) cnt++;
    });
    return cnt;
  }, [status, user?.uid, visibleIds, readIds]);

  // ===== お問い合わせ未読（管理者のみ） =====
  const isAdmin = !!user && user.uid === ADMIN_UID;
  const [unreadContacts, setUnreadContacts] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "contacts"), where("status", "==", "unread"));
    const unsub = onSnapshot(q, (snap) => {
      setUnreadContacts(snap.size);
    });
    return () => unsub();
  }, [isAdmin]);

  // classes
  const containerClasses = cn(
    "bg-[#050509] rounded-3xl text-white",
    "flex flex-col",
    isMobile ? "w-full p-4" : "w-80 p-6",
    className
  );
  const groupTitleClasses = cn(
    "text-xs font-semibold uppercase tracking-wide text-gray-400",
    "mt-4 mb-2"
  );
  const itemClasses = cn(
    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-gray-100",
    "hover:bg-white/10 active:bg-white/15 transition-colors"
  );
  const subItemClasses = cn(
    "flex items-center gap-3 px-3 py-2 text-xs text-gray-400",
    "hover:text-gray-100 hover:bg-white/5 transition-colors"
  );

  return (
    <>
      <nav className={containerClasses} aria-label="設定メニュー">
        {/* ヘッダー */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 overflow-hidden">
            <img
              src="/logo/logo.png"
              alt="Uniterz Logo"
              className="w-6 h-6 object-contain select-none"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Menu</span>
            <span className="text-sm font-semibold">設定とメニュー</span>
          </div>
        </div>

        {/* === Main === */}
        <p className={groupTitleClasses}>メイン</p>

        <button
          type="button"
          className={itemClasses}
          onClick={() => router.push(profileEditPath)}
        >
          <User className="h-4 w-4" />
          <span>プロフィール編集</span>
        </button>

        <button
  type="button"
  className={itemClasses}
  onClick={() =>
    router.push(variant === "web" ? "/web/badges" : "/mobile/badges")
  }
>
  <Award className="h-4 w-4" />
  <span>バッジパレット</span>
</button>


        <button
          type="button"
          className={itemClasses}
          onClick={() => router.push(bookmarksPath)}
        >
          <Bookmark className="h-4 w-4" />
          <span>ブックマーク</span>
        </button>

        <button
          type="button"
          className={itemClasses}
          onClick={() => router.push(announcementsPath)}
        >
          <Megaphone className="h-4 w-4" />
          <span className="relative inline-flex items-center">
            運営からのお知らせ
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 text-[11px] font-bold leading-none px-1 shadow-[0_0_10px_rgba(255,0,0,0.6)]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
        </button>

        {/* === Plan === */}
        <p className={groupTitleClasses}>プラン</p>

        <button
          type="button"
          className={itemClasses}
          onClick={() => setShowPlanInfoModal(true)}
        >
          <FilePlus2 className="h-4 w-4" />
          <span>プラン作成</span>
        </button>

        <button
          type="button"
          className={itemClasses}
          onClick={() => setShowPlanInfoModal(true)}
        >
          <Package className="h-4 w-4" />
          <span>加入プラン</span>
        </button>

        {/* === Settings === */}
        <p className={groupTitleClasses}>設定</p>

        <button type="button" className={itemClasses}>
          <Bell className="h-4 w-4" />
          <span>通知設定</span>
        </button>

        {/* !!! プライバシーデータは削除済み !!! */}

        {/* === Support === */}
        <p className={groupTitleClasses}>サポート</p>

        <button
          type="button"
          className={subItemClasses}
          onClick={() => router.push(resetPath)}
        >
          <Key className="h-4 w-4" />
          <span>パスワードをリセット</span>
        </button>

        <button
          type="button"
          className={subItemClasses}
          onClick={() => router.push(helpPath)}
        >
          <HelpCircle className="h-4 w-4" />
          <span>ヘルプ</span>
        </button>

        <button
          type="button"
          className={subItemClasses}
          onClick={() => router.push(guidelinesPath)}
        >
          <Users className="h-4 w-4" />
          <span>コミュニティガイドライン</span>
        </button>

        <button
          type="button"
          className={subItemClasses}
          onClick={() => router.push(termsPath)}
        >
          <FileText className="h-4 w-4" />
          <span>利用規約</span>
        </button>

        <button
          type="button"
          className={subItemClasses}
          onClick={() => router.push(contactPath)}
        >
          <Mail className="h-4 w-4" />
          <span>お問い合わせ</span>
        </button>

        {isAdmin && (
          <>
            <p className={groupTitleClasses}>管理</p>

            <button
              type="button"
              className={itemClasses}
              onClick={() => router.push("/admin")}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>管理画面ダッシュボード</span>
            </button>

            <button
  type="button"
  className={itemClasses}
  onClick={() => router.push("/admin/badges")}
>
  <Award className="h-4 w-4" />
  <span>バッジ付与</span>
</button>


            <button
              type="button"
              className={itemClasses}
              onClick={() => router.push("/admin/announcements")}
            >
              <Newspaper className="h-4 w-4" />
              <span>お知らせ管理</span>
            </button>

            <button
              type="button"
              className={itemClasses}
              onClick={() => router.push("/admin/announcements/new")}
            >
              <PlusSquare className="h-4 w-4" />
              <span>お知らせを作成</span>
            </button>

            <button
              type="button"
              className={itemClasses}
              onClick={() => router.push("/admin/games-import")}
            >
              <Database className="h-4 w-4" />
              <span>試合データ インポート</span>
            </button>

            <button
              type="button"
              className={itemClasses}
              onClick={() => router.push("/admin/plans")}
            >
              <CheckCheck className="h-4 w-4" />
              <span>プラン承認</span>
            </button>

            <button
              type="button"
              className={itemClasses}
              onClick={() => router.push("/admin/contacts")}
            >
              <Mail className="h-4 w-4" />
              <span className="relative inline-flex items-center">
                お問い合わせ一覧
                {unreadContacts > 0 && (
                  <span className="ml-2 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 text-[11px] font-bold leading-none px-1 shadow-[0_0_10px_rgba(255,0,0,0.6)]">
                    {unreadContacts > 99 ? "99+" : unreadContacts}
                  </span>
                )}
              </span>
            </button>
          </>
        )}

        {/* --- ログアウト --- */}
        <div className="mt-5 border-t border-white/5 pt-3">
          <button
            type="button"
            className={itemClasses}
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className="h-4 w-4" />
            <span>ログアウト</span>
          </button>
        </div>
      </nav>

      {/* プラン案内モーダル */}
      {showPlanInfoModal && (
        <div
          className={cn(
            "fixed inset-0 z-[9999] flex justify-center bg-black/50 p-4",
            isMobile ? "items-end" : "items-center"
          )}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#050509] p-4 md:p-5 shadow-xl">
            <h2 className="text-sm font-semibold mb-2">プラン機能は準備中です</h2>
            <p className="text-xs text-gray-200 leading-relaxed">
              プラン機能は現在準備中です。
            </p>
            <p className="mt-1 text-xs text-gray-200 leading-relaxed">
              今後、クリエイターが独自プランを作成して、有料予想を公開できる機能も追加予定です。
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPlanInfoModal(false)}
                className="rounded-xl bg-white text-black text-xs font-semibold px-4 py-2 hover:bg-gray-100"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
