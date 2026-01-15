// app/component/settings/SettingsMenu.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import cn from "clsx";
import {
  User,
  Bookmark,
  Megaphone,
  FilePlus2,
  Package,
  HelpCircle,
  LogOut,
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
import { useRouter, usePathname } from "next/navigation";
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
  doc,
} from "firebase/firestore";
import LogoutConfirmModal from "../modals/LogoutConfirmModal";
import LoginRequiredModal from "../modals/LoginRequiredModal";

type Variant = "mobile" | "web";
type SettingsMenuProps = {
  variant?: Variant; // 互換用に残す（ロジックでは使わない）
  className?: string;
};

export default function SettingsMenu({ className }: SettingsMenuProps) {
  const router = useRouter();
  const pathname = usePathname();

  /** ★ 実際に使うのはこれだけ */
  const resolvedVariant: Variant = pathname.startsWith("/web")
    ? "web"
    : "mobile";

  const isMobile = resolvedVariant === "mobile";

  const { fUser: user, status } = useFirebaseUser();

  const requireLogin = (action: () => void) => {
    if (!user) {
      setShowLoginRequired(true);
      return;
    }
    action();
  };

  // ===== state =====
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [showPlanInfoModal, setShowPlanInfoModal] = useState(false);

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [plan, setPlan] = useState<"free" | "pro">("free");

  // ===== logout =====
  const handleLogout = async () => {
    await signOut(auth);
    router.push(
      resolvedVariant === "web" ? "/web/login" : "/mobile/login"
    );
  };

  // ===== paths（すべて resolvedVariant ベース）=====
  const p = (web: string, mobile: string) =>
    resolvedVariant === "web" ? web : mobile;

  const profileEditPath = p(
    "/web/settings/profile",
    "/mobile/settings/profile"
  );
  const bookmarksPath = p("/web/bookmarks", "/mobile/bookmarks");
  const announcementsPath = p(
    "/web/announcements",
    "/mobile/announcements"
  );
  const resetPath = p(
    "/web/settings/password",
    "/mobile/settings/password"
  );
  const helpPath = p("/web/help", "/mobile/help");
  const termsPath = p("/web/terms", "/mobile/terms");
  const guidelinesPath = p(
    "/web/community-guidelines",
    "/mobile/community-guidelines"
  );
  const contactPath = p("/web/contact", "/mobile/contact");

  const refundPath = p(
  "/web/refund",
  "/mobile/refund"
);

  // ===== announcements unread =====
  useEffect(() => {
    if (status !== "ready") return;
    const q = query(
      collection(db, "announcements"),
      where("visible", "==", true),
      orderBy("pinned", "desc"),
      orderBy("postedAt", "desc"),
      limit(30)
    );
    return onSnapshot(q, snap => {
      const s = new Set<string>();
      snap.forEach(d => s.add(d.id));
      setVisibleIds(s);
    });
  }, [status]);

  useEffect(() => {
    if (!user?.uid) {
      setReadIds(new Set());
      return;
    }
    return onSnapshot(
      collection(db, `users/${user.uid}/reads`),
      snap => {
        const s = new Set<string>();
        snap.forEach(d => s.add(d.id));
        setReadIds(s);
      }
    );
  }, [user?.uid]);

  const unreadCount = useMemo(() => {
    let c = 0;
    visibleIds.forEach(id => {
      if (!readIds.has(id)) c++;
    });
    return c;
  }, [visibleIds, readIds]);

  // ===== plan =====
  useEffect(() => {
    if (!user?.uid) return;
    return onSnapshot(doc(db, "users", user.uid), snap => {
      const p = snap.data()?.plan;
      setPlan(p === "pro" ? "pro" : "free");
    });
  }, [user?.uid]);

  const isAdmin = user?.uid === ADMIN_UID;

  // ===== styles =====
  const containerClasses = cn(
    "bg-[#050509] rounded-3xl text-white flex flex-col",
    isMobile ? "w-full p-4" : "w-80 p-6",
    className
  );

  const groupTitleClasses =
    "text-xs font-semibold uppercase tracking-wide text-gray-400 mt-4 mb-2";
  const itemClasses =
    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm hover:bg-white/10 transition";
  const subItemClasses =
    "flex items-center gap-3 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5";

  return (
    <>
      <nav className={containerClasses}>
        <p className={groupTitleClasses}>メイン</p>

        <button className={itemClasses} onClick={() => requireLogin(() => router.push(profileEditPath))}>
          <User size={16} /> プロフィール編集
        </button>

        <button className={itemClasses} onClick={() => requireLogin(() => router.push(p("/web/badges", "/mobile/badges")))}>
          <Award size={16} /> バッジパレット
        </button>

        <button className={itemClasses} onClick={() => requireLogin(() => router.push(bookmarksPath))}>
          <Bookmark size={16} /> ブックマーク
        </button>

        <button className={itemClasses} onClick={() => requireLogin(() => router.push(announcementsPath))}>
          <Megaphone size={16} /> お知らせ
          {unreadCount > 0 && <span className="ml-auto text-xs bg-red-500 px-2 rounded-full">{unreadCount}</span>}
        </button>

        <p className={groupTitleClasses}>サブスクリプション</p>

        <button
          className={itemClasses}
          onClick={() =>
            requireLogin(() =>
              router.push(
                resolvedVariant === "web"
                  ? plan === "pro"
                    ? "/web/plan-status"
                    : "/web/pro/subscribe"
                  : plan === "pro"
                    ? "/mobile/plan-status"
                    : "/mobile/pro/subscribe"
              )
            )
          }
        >
          <Package size={16} /> プランの確認
        </button>

        <p className={groupTitleClasses}>サポート</p>

        <button className={subItemClasses} onClick={() => router.push(resetPath)}>
          <Key size={14} /> パスワードリセット
        </button>

        <button className={subItemClasses} onClick={() => router.push(helpPath)}>
          <HelpCircle size={14} /> ヘルプ
        </button>

        <button className={subItemClasses} onClick={() => router.push(guidelinesPath)}>
          <Users size={14} /> ガイドライン
        </button>

        <button className={subItemClasses} onClick={() => router.push(termsPath)}>
          <FileText size={14} /> 利用規約
        </button>

        <button
  className={subItemClasses}
  onClick={() => router.push(refundPath)}
>
  <FileText size={14} /> 返金・キャンセルポリシー
</button>

        <button className={subItemClasses} onClick={() => router.push(contactPath)}>
          <Mail size={14} /> お問い合わせ
        </button>

        {isAdmin && (
          <>
            <p className={groupTitleClasses}>管理</p>

            <button className={itemClasses} onClick={() => router.push("/admin")}>
              <LayoutDashboard size={16} /> 管理ダッシュボード
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/badges")}>
              <Award size={16} /> バッジ付与
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/announcements")}>
              <Newspaper size={16} /> お知らせ管理
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/announcements/new")}>
              <PlusSquare size={16} /> お知らせ作成
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/games-import")}>
              <Database size={16} /> 試合インポート
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/plans")}>
              <CheckCheck size={16} /> プラン承認
            </button>
          </>
        )}

        <div className="mt-5 border-t border-white/10 pt-3">
          <button className={itemClasses} onClick={() => setShowLogoutModal(true)}>
            <LogOut size={16} /> ログアウト
          </button>
        </div>
      </nav>

      <LoginRequiredModal
        open={showLoginRequired}
        onClose={() => setShowLoginRequired(false)}
        variant={resolvedVariant}
      />

      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
