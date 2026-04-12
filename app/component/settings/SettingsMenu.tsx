// app/component/settings/SettingsMenu.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import cn from "clsx";
import {
  User,
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
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import LogoutConfirmModal from "../modals/LogoutConfirmModal";
import ProfileEditSheet from "@/app/component/profile/ProfileEditSheet";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

type Variant = "mobile" | "web";
type SettingsMenuProps = {
  variant?: Variant; // 互換用に残す（ロジックでは使わない）
  className?: string;
  /** プロフィール編集オーバーレイを開く前にサイドメニューを閉じる */
  onRequestCloseMenu?: () => void;
};

export default function SettingsMenu({
  className,
  onRequestCloseMenu,
}: SettingsMenuProps) {
  const router = useRouter();
  const pathname = usePathname();

  /** ★ 実際に使うのはこれだけ */
  const resolvedVariant: Variant = pathname.startsWith("/web")
    ? "web"
    : "mobile";

  const isMobile = resolvedVariant === "mobile";

  const { fUser: user, status } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isEn = language === "en";

  // ===== state =====
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPlanInfoModal, setShowPlanInfoModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

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
  const featureRequestPath = p("/web/feature-request", "/mobile/feature-request");

  // ===== announcements unread =====
  useEffect(() => {
    if (status !== "ready") return;
    let alive = true;
    const q = query(
      collection(db, "announcements"),
      where("visible", "==", true),
      orderBy("pinned", "desc"),
      orderBy("postedAt", "desc"),
      limit(30)
    );
    getDocs(q).then((snap) => {
      if (!alive) return;
      const s = new Set<string>();
      snap.forEach((d) => s.add(d.id));
      setVisibleIds(s);
    });
    return () => { alive = false; };
  }, [status]);

  useEffect(() => {
    if (!user?.uid) {
      setReadIds(new Set());
      return;
    }
    let alive = true;
    getDocs(collection(db, `users/${user.uid}/reads`)).then((snap) => {
      if (!alive) return;
      const s = new Set<string>();
      snap.forEach((d) => s.add(d.id));
      setReadIds(s);
    });
    return () => { alive = false; };
  }, [user?.uid]);

  const unreadCount = useMemo(() => {
    let c = 0;
    visibleIds.forEach((id) => {
      if (!readIds.has(id)) c++;
    });
    return c;
  }, [visibleIds, readIds]);

  // ===== plan =====
  useEffect(() => {
    if (!user?.uid) return;
    let alive = true;
    getUserDocDataCached(user.uid).then((data) => {
      if (!alive) return;
      const p = data?.plan;
      setPlan(p === "pro" ? "pro" : "free");
    });
    return () => { alive = false; };
  }, [user?.uid]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const openProfileEditOverlay = () => {
    onRequestCloseMenu?.();
    setShowProfileEdit(true);
  };

  const isAdmin = user?.uid === ADMIN_UID;

  // ===== styles =====
  const containerClasses = cn(
    "relative text-white flex flex-col",
    isMobile ? "w-full p-4" : "w-full p-6",
    className
  );

  const groupTitleClasses = cn(
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/55 mt-4 mb-2",
    isMobile ? "pl-7" : "pl-5"
  );
  const itemClasses = cn(
    "group relative flex items-center gap-3 border-b border-white/8 py-3 text-sm text-white/88 transition hover:bg-slate-200/[0.05]",
    isMobile ? "pl-7 pr-3" : "px-5"
  );
  const subItemClasses = cn(
    "group relative flex items-center gap-3 border-b border-white/8 py-2 text-xs text-slate-300/75 transition hover:bg-slate-200/[0.04] hover:text-white",
    isMobile ? "pl-7 pr-3" : "px-5"
  );

  return (
    <>
      <nav className={cn(containerClasses, "overflow-x-hidden")}>
        <p className={groupTitleClasses}>{isEn ? "Main" : "メイン"}</p>

        <button
          type="button"
          className={itemClasses}
          onClick={openProfileEditOverlay}
        >
          <User size={16} /> {isEn ? "Edit Profile" : "プロフィール編集"}
        </button>

        <button className={itemClasses} onClick={() => router.push(p("/web/badges", "/mobile/badges"))}>
          <Award size={16} /> {isEn ? "Badge Palette" : "バッジパレット"}
        </button>

        <button className={itemClasses} onClick={() => router.push(announcementsPath)}>
          <Megaphone size={16} /> {isEn ? "Announcements" : "お知らせ"}
          {unreadCount > 0 && <span className="ml-auto text-xs bg-red-500 px-2 rounded-full">{unreadCount}</span>}
        </button>

        <p className={groupTitleClasses}>{isEn ? "Subscription" : "サブスクリプション"}</p>

        <button
          className={itemClasses}
          onClick={() =>
            router.push(
              resolvedVariant === "web"
                ? plan === "pro"
                  ? "/web/plan-status"
                  : "/web/pro/subscribe"
                : plan === "pro"
                  ? "/mobile/plan-status"
                  : "/mobile/pro/subscribe"
            )
          }
        >
          <Package size={16} /> {isEn ? "Plan Status" : "プランの確認"}
        </button>

        <p className={groupTitleClasses}>{isEn ? "Support" : "サポート"}</p>

        <button className={subItemClasses} onClick={() => router.push(resetPath)}>
          <Key size={14} /> {isEn ? "Password Reset" : "パスワードリセット"}
        </button>

        <button className={subItemClasses} onClick={() => router.push(helpPath)}>
          <HelpCircle size={14} /> {isEn ? "Help" : "ヘルプ"}
        </button>

        <button className={subItemClasses} onClick={() => router.push(guidelinesPath)}>
          <Users size={14} /> {isEn ? "Community Guidelines" : "ガイドライン"}
        </button>

        <button className={subItemClasses} onClick={() => router.push(termsPath)}>
          <FileText size={14} /> {isEn ? "Terms of Service" : "利用規約"}
        </button>

        <button className={subItemClasses} onClick={() => router.push(contactPath)}>
          <Mail size={14} /> {isEn ? "Contact" : "お問い合わせ"}
        </button>

        <button className={subItemClasses} onClick={() => router.push(featureRequestPath)}>
          <FilePlus2 size={14} /> {isEn ? "Feature Request" : "要望を送る"}
        </button>

        {isAdmin && (
          <>
            <p className={groupTitleClasses}>{isEn ? "Admin" : "管理"}</p>

        <button className={itemClasses} onClick={() => router.push("/admin")}>
              <LayoutDashboard size={16} /> {isEn ? "Admin Dashboard" : "管理ダッシュボード"}
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/badges")}>
              <Award size={16} /> {isEn ? "Grant Badges" : "バッジ付与"}
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/announcements")}>
              <Newspaper size={16} /> {isEn ? "Manage Announcements" : "お知らせ管理"}
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/announcements/new")}>
              <PlusSquare size={16} /> {isEn ? "Create Announcement" : "お知らせ作成"}
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/games-import")}>
              <Database size={16} /> {isEn ? "Game Import" : "試合インポート"}
            </button>

            <button className={itemClasses} onClick={() => router.push("/admin/plans")}>
              <CheckCheck size={16} /> {isEn ? "Plan Approval" : "プラン承認"}
            </button>
          </>
        )}

        <div className="mt-5 border-t border-white/10 pt-3 pb-3">
          <button
            type="button"
            className={cn(itemClasses, "border-b-0")}
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={16} /> {isEn ? "Logout" : "ログアウト"}
          </button>
        </div>
      </nav>

      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        language={language}
      />

      {portalReady &&
        showProfileEdit &&
        createPortal(
          <ProfileEditSheet onClose={() => setShowProfileEdit(false)} />,
          document.body
        )}
    </>
  );
}
