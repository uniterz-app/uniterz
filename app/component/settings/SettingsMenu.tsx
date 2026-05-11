// app/component/settings/SettingsMenu.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import cn from "clsx";
import {
  User,
  Megaphone,
  Package,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  Newspaper,
  PlusSquare,
  Database,
  CheckCheck,
  FileText,
  Users,
  Mail,
  Award,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthStateResolved, useFirebaseUser } from "@/lib/useFirebaseUser";
import { ADMIN_UID } from "@/lib/constants";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { useAnnouncementsUnread } from "@/lib/hooks/useAnnouncementsUnread";
import LogoutConfirmModal from "../modals/LogoutConfirmModal";
import ProfileEditSheet from "@/app/component/profile/ProfileEditSheet";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import SideMenuItemButton from "@/app/component/settings/SideMenuItemButton";
import {
  markNavigatedFromSideMenu,
  clearSideMenuOrigin,
} from "@/lib/navigation/sideMenuReturnNav";

type Variant = "mobile" | "web";
type SettingsMenuProps = {
  variant?: Variant; // 互換用に残す（ロジックでは使わない）
  className?: string;
  /** プロフィール編集オーバーレイを開く前にサイドメニューを閉じる */
  onRequestCloseMenu?: () => void;
  /** プロフィール編集を戻るで閉じたあとサイドメニューを再度開く */
  onRequestOpenMenu?: () => void;
};

export default function SettingsMenu({
  className,
  onRequestCloseMenu,
  onRequestOpenMenu,
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
  const m = t(language);
  const isEn = language === "en";

  // ===== state =====
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPlanInfoModal, setShowPlanInfoModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const { unreadCount } = useAnnouncementsUnread({
    enabled: isAuthStateResolved(status),
  });

  // ===== logout =====
  const handleLogout = async () => {
    clearSideMenuOrigin();
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
  const helpPath = p("/web/help", "/mobile/help");
  const termsPath = p("/web/terms", "/mobile/terms");
  const guidelinesPath = p(
    "/web/community-guidelines",
    "/mobile/community-guidelines"
  );
  const contactPath = p("/web/contact", "/mobile/contact");

  // ===== plan =====
  useEffect(() => {
    if (!user?.uid) {
      setPlan("free");
      return;
    }
    let alive = true;
    getUserDocDataCached(user.uid).then((data) => {
      if (!alive) return;
      const p = data?.plan;
      setPlan(p === "pro" ? "pro" : "free");
    });
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const openProfileEditOverlay = () => {
    onRequestCloseMenu?.();
    setShowProfileEdit(true);
  };

  const isAdmin = user?.uid === ADMIN_UID;

  /** サイドメニューからの遷移（戻るボタン用フラグ） */
  const pushFromMenu = (href: string) => {
    markNavigatedFromSideMenu();
    router.push(href);
  };

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
  /** 試合カードの HOME/AWAY ラベルと同系統 */
  const menuLabelFont = bracketMarketTeamTypography(isMobile);

  return (
    <>
      <nav className={cn(containerClasses, "overflow-x-hidden")}>
        <p className={groupTitleClasses}><span className={cn(isEn && "uppercase")}>{m.settings.sectionMain}</span></p>

        <div className="flex flex-col gap-2">
          <SideMenuItemButton
            icon={User}
            labelStyle={menuLabelFont}
            onClick={openProfileEditOverlay}
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.editProfile}</span>
          </SideMenuItemButton>

          <SideMenuItemButton
            icon={Award}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(p("/web/badges", "/mobile/badges"))}
          >
            <span className={cn(isEn && "uppercase")}>{m.profile.badgePalette}</span>
          </SideMenuItemButton>

          <SideMenuItemButton
            icon={Megaphone}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(announcementsPath)}
            trailing={
              unreadCount > 0 ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                  {unreadCount}
                </span>
              ) : undefined
            }
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.announcements}</span>
          </SideMenuItemButton>
        </div>

        <p className={groupTitleClasses}><span className={cn(isEn && "uppercase")}>{m.settings.sectionSubscription}</span></p>

        <div className="flex flex-col gap-2">
          <SideMenuItemButton
            icon={Package}
            labelStyle={menuLabelFont}
            onClick={() =>
              pushFromMenu(
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
            <span className={cn(isEn && "uppercase")}>{m.settings.planStatus}</span>
          </SideMenuItemButton>
        </div>

        <p className={groupTitleClasses}><span className={cn(isEn && "uppercase")}>{m.settings.sectionSupport}</span></p>

        <div className="flex flex-col gap-2">
          <SideMenuItemButton
            dense
            icon={HelpCircle}
            iconSize={15}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(helpPath)}
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.help}</span>
          </SideMenuItemButton>

          <SideMenuItemButton
            dense
            icon={Users}
            iconSize={15}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(guidelinesPath)}
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.communityGuidelines}</span>
          </SideMenuItemButton>

          <SideMenuItemButton
            dense
            icon={FileText}
            iconSize={15}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(termsPath)}
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.termsOfService}</span>
          </SideMenuItemButton>

          <SideMenuItemButton
            dense
            icon={Mail}
            iconSize={15}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(contactPath)}
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.contact}</span>
          </SideMenuItemButton>
        </div>

        {isAdmin && (
          <>
            <p className={groupTitleClasses}><span className={cn(isEn && "uppercase")}>{m.settings.sectionAdmin}</span></p>

            <div className="flex flex-col gap-2">
              <SideMenuItemButton
                icon={LayoutDashboard}
                labelStyle={menuLabelFont}
                onClick={() => pushFromMenu("/admin")}
              >
                <span className={cn(isEn && "uppercase")}>{m.settings.adminDashboard}</span>
              </SideMenuItemButton>

              <SideMenuItemButton
                icon={Award}
                labelStyle={menuLabelFont}
                onClick={() => pushFromMenu("/admin/badges")}
              >
                <span className={cn(isEn && "uppercase")}>{m.settings.grantBadges}</span>
              </SideMenuItemButton>

              <SideMenuItemButton
                icon={Newspaper}
                labelStyle={menuLabelFont}
                onClick={() => pushFromMenu("/admin/announcements")}
              >
                <span className={cn(isEn && "uppercase")}>{m.settings.manageAnnouncements}</span>
              </SideMenuItemButton>

              <SideMenuItemButton
                icon={PlusSquare}
                labelStyle={menuLabelFont}
                onClick={() => pushFromMenu("/admin/announcements/new")}
              >
                <span className={cn(isEn && "uppercase")}>{m.settings.createAnnouncement}</span>
              </SideMenuItemButton>

              <SideMenuItemButton
                icon={Database}
                labelStyle={menuLabelFont}
                onClick={() => pushFromMenu("/admin/games-import")}
              >
                <span className={cn(isEn && "uppercase")}>{m.settings.gameImport}</span>
              </SideMenuItemButton>

              <SideMenuItemButton
                icon={CheckCheck}
                labelStyle={menuLabelFont}
                onClick={() => pushFromMenu("/admin/plans")}
              >
                <span className={cn(isEn && "uppercase")}>{m.settings.planApproval}</span>
              </SideMenuItemButton>
            </div>
          </>
        )}

        <div className="mt-5 border-t border-white/10 pt-4 pb-1">
          <SideMenuItemButton
            icon={LogOut}
            tone="danger"
            labelStyle={menuLabelFont}
            onClick={() => setShowLogoutModal(true)}
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.logout}</span>
          </SideMenuItemButton>
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
          <ProfileEditSheet
            onClose={() => setShowProfileEdit(false)}
            reopenMenu={onRequestOpenMenu}
          />,
          document.body
        )}
    </>
  );
}
