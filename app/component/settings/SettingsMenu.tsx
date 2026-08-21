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
  FileText,
  Users,
  Mail,
  Award,
  Lightbulb,
  Sparkles,
  Trash2,
  Hexagon,
  UserPlus,
  Coins,
  ShoppingBag,
  GraduationCap,
  Bell,
} from "lucide-react";
import {
  parseUserProfileFields,
  parseUserUnitBalance,
} from "@/lib/profile/parseUserProfileFields";
import { nameOxanium } from "@/lib/fonts";
import { useRouter, usePathname } from "next/navigation";
import { isAuthStateResolved, useFirebaseUser } from "@/lib/useFirebaseUser";
import { useIsAdmin } from "@/lib/admin/useIsAdmin";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { useAnnouncementsUnread } from "@/lib/hooks/useAnnouncementsUnread";
import { useAdminInboxUnread } from "@/lib/admin/useAdminInboxUnread";
import LogoutConfirmModal from "../modals/LogoutConfirmModal";
import ProfileEditSheet from "@/app/component/profile/ProfileEditSheet";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import { CyberSideMenuSectionTitle } from "@/app/component/common/CyberSideMenuSectionTitle";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import SideMenuItemButton from "@/app/component/settings/SideMenuItemButton";
import {
  RankingNameBadges,
} from "@/app/component/common/RankingNameBadges";
import { proBadgeStaticMotion } from "@/app/component/common/ProCyberBadge";
import {
  markNavigatedFromSideMenu,
  clearSideMenuOrigin,
} from "@/lib/navigation/sideMenuReturnNav";
import { PRO_SKIN_PATH } from "@/lib/pro/proSkinRoutes";
import { clearAppTutorialSeen } from "@/lib/tutorial/tutorialSeen";
import { writeTutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";
import { clearTutorialLivePick } from "@/lib/tutorial/tutorialLivePick";
import { setAppTutorialBlockingEvents } from "@/lib/tutorial/tutorialBlockingEvents";
import { setTutorialWelcomeChromeHidden } from "@/lib/tutorial/tutorialWelcomeChrome";
import { setTutorialRestartCover } from "@/lib/tutorial/tutorialRestartCover";
import { beginTutorialWelcomeIntroSession } from "@/lib/tutorial/tutorialWelcomeSkipIntro";
import { markTutorialWelcomeReturning } from "@/lib/tutorial/tutorialWelcomeAudience";

type Variant = "mobile" | "web";
type SettingsMenuProps = {
  variant?: Variant; // 互換用に残す（ロジックでは使わない）
  className?: string;
  /** プロフィール編集オーバーレイを開く前にサイドメニューを閉じる */
  onRequestCloseMenu?: () => void;
  /** プロフィール編集を戻るで閉じたあとサイドメニューを再度開く */
  onRequestOpenMenu?: () => void;
  /**
   * 指定時は親が ProfileEditSheet を出す。
   * （ドロワー閉じてもシートが生き残る・戻るでメニュー再開が確実）
   */
  onOpenProfileEdit?: () => void;
};

export default function SettingsMenu({
  className,
  onRequestCloseMenu,
  onRequestOpenMenu,
  onOpenProfileEdit,
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
  const [unitBalance, setUnitBalance] = useState<number>(0);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const { unreadCount } = useAnnouncementsUnread({
    enabled: isAuthStateResolved(status),
  });

  // ===== logout =====
  const handleLogout = async () => {
    clearSideMenuOrigin();
    await signOut(auth);
    router.push(resolvedVariant === "web" ? "/lp" : "/mobile/login");
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

  // ===== plan / Unit 残高 / 表示名・アイコン =====
  useEffect(() => {
    if (!user?.uid) {
      setPlan("free");
      setUnitBalance(0);
      setDisplayName("");
      setHandle("");
      setAvatarUrl("");
      return;
    }
    let alive = true;
    getUserDocDataCached(user.uid).then((data) => {
      if (!alive) return;
      const row = (data ?? {}) as Record<string, unknown>;
      const p = data?.plan;
      setPlan(p === "pro" ? "pro" : "free");
      setUnitBalance(parseUserUnitBalance(row));
      const { displayName: name, handle: h } = parseUserProfileFields(row);
      setDisplayName(
        name || user.displayName?.trim() || (isEn ? "User" : "ユーザー")
      );
      setHandle(h);
      const photo =
        (typeof row.photoURL === "string" && row.photoURL.trim()) ||
        (typeof row.avatarUrl === "string" && row.avatarUrl.trim()) ||
        user.photoURL?.trim() ||
        "";
      setAvatarUrl(photo);
    });
    return () => {
      alive = false;
    };
  }, [user?.uid, user?.displayName, user?.photoURL, isEn]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const openProfileEditOverlay = () => {
    if (onOpenProfileEdit) {
      onOpenProfileEdit();
      return;
    }
    // フォールバック: メニュー内ポータル（親未対応時）
    setShowProfileEdit(true);
    window.setTimeout(() => {
      onRequestCloseMenu?.();
    }, 40);
  };

  const { isAdmin } = useIsAdmin();
  const adminInbox = useAdminInboxUnread(isAdmin);

  function CountBadge({
    count,
    tone,
  }: {
    count: number;
    tone: "announce" | "admin";
  }) {
    if (count <= 0) return null;
    return (
      <span
        className={
          tone === "announce"
            ? "rounded-full bg-[#00F5FF] px-2 py-0.5 text-[10px] font-semibold text-[#050508] tabular-nums"
            : "rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white tabular-nums"
        }
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  }

  /** サイドメニューからの遷移（戻るボタン用フラグ） */
  const pushFromMenu = (href: string) => {
    markNavigatedFromSideMenu();
    router.push(href);
  };

  const restartTutorialFromMenu = () => {
    const uid = user?.uid ?? null;
    /** メニュー閉鎖とルート切替の下にプロフィールを出さない */
    setTutorialRestartCover(true);
    setTutorialWelcomeChromeHidden(true);
    void clearAppTutorialSeen(uid);
    clearTutorialLivePick();
    markTutorialWelcomeReturning();
    beginTutorialWelcomeIntroSession();
    writeTutorialLivePhase("welcome");
    setAppTutorialBlockingEvents(true);
    onRequestCloseMenu?.();
    const gamesHref = p("/web/games", "/mobile/games");
    if (pathname !== gamesHref) {
      pushFromMenu(gamesHref);
    }
  };

  // ===== styles =====
  const containerClasses = cn(
    "relative flex min-h-full flex-col text-white",
    isMobile ? "w-full p-4" : "w-full p-5",
    className
  );
  const identityName =
    displayName.trim() ||
    user?.displayName?.trim() ||
    (isEn ? "User" : "ユーザー");
  const identityInitial = identityName.charAt(0).toUpperCase() || "?";
  const planLabel = plan === "pro" ? "PRO" : "FREE";
  /** 試合カードの HOME/AWAY ラベルと同系統 */
  const menuLabelFont = bracketMarketTeamTypography(isMobile);

  return (
    <>
      <nav className={cn(containerClasses, "overflow-x-hidden")}>
        {user?.uid ? (
          <button
            type="button"
            className="side-menu-unit-wallet"
            onClick={() => pushFromMenu(p("/web/units", "/mobile/units"))}
            aria-label={
              isEn
                ? `${unitBalance.toLocaleString("en-US")} Units · Open history`
                : `保有 Unit ${unitBalance.toLocaleString("ja-JP")} · 履歴を開く`
            }
          >
            <span className="side-menu-unit-wallet__mark" aria-hidden>
              <Hexagon
                className="side-menu-unit-wallet__hex"
                strokeWidth={1.6}
              />
              <span className="side-menu-unit-wallet__u">U</span>
            </span>
            <span className="side-menu-unit-wallet__meta">
              <span className="side-menu-unit-wallet__label">UNITS</span>
              <span className="side-menu-unit-wallet__value">
                {unitBalance.toLocaleString("en-US")}
              </span>
            </span>
          </button>
        ) : null}

        <CyberSideMenuSectionTitle first>
          <span className={cn(isEn && "uppercase")}>{m.settings.sectionMain}</span>
        </CyberSideMenuSectionTitle>

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
            icon={UserPlus}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(p("/web/invite", "/mobile/invite"))}
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.invite}</span>
          </SideMenuItemButton>

          <SideMenuItemButton
            icon={Coins}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(p("/web/units", "/mobile/units"))}
          >
            <span className={cn(isEn && "uppercase")}>
              {m.settings.unitHistory}
            </span>
          </SideMenuItemButton>

          <SideMenuItemButton
            icon={ShoppingBag}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(p("/web/redeem", "/mobile/redeem"))}
          >
            <span className={cn(isEn && "uppercase")}>
              {m.settings.unitRedeem}
            </span>
          </SideMenuItemButton>

          <SideMenuItemButton
            icon={Megaphone}
            labelStyle={menuLabelFont}
            onClick={() => pushFromMenu(announcementsPath)}
            trailing={<CountBadge count={unreadCount} tone="announce" />}
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.announcements}</span>
          </SideMenuItemButton>

          <SideMenuItemButton
            icon={Bell}
            labelStyle={menuLabelFont}
            onClick={() =>
              pushFromMenu(
                p("/web/settings/notifications", "/mobile/settings/notifications")
              )
            }
          >
            <span className={cn(isEn && "uppercase")}>
              {m.settings.notifications}
            </span>
          </SideMenuItemButton>
        </div>

        <CyberSideMenuSectionTitle>
          <span className={cn(isEn && "uppercase")}>{m.settings.sectionSubscription}</span>
        </CyberSideMenuSectionTitle>

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
          <SideMenuItemButton
            icon={Sparkles}
            labelStyle={menuLabelFont}
            onClick={() =>
              pushFromMenu(
                resolvedVariant === "web" ? PRO_SKIN_PATH.web : PRO_SKIN_PATH.mobile
              )
            }
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.proSkin}</span>
          </SideMenuItemButton>
        </div>

        <CyberSideMenuSectionTitle>
          <span className={cn(isEn && "uppercase")}>{m.settings.sectionSupport}</span>
        </CyberSideMenuSectionTitle>

        <div className="flex flex-col gap-2">
          <SideMenuItemButton
            dense
            icon={GraduationCap}
            iconSize={15}
            labelStyle={menuLabelFont}
            onClick={() => restartTutorialFromMenu()}
          >
            <span className={cn(isEn && "uppercase")}>
              {m.tutorial.restartFromMenu}
            </span>
          </SideMenuItemButton>

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
            <CyberSideMenuSectionTitle>
              <span className={cn(isEn && "uppercase")}>{m.settings.sectionAdmin}</span>
            </CyberSideMenuSectionTitle>

            <div className="flex flex-col gap-2">
              <SideMenuItemButton
                icon={Lightbulb}
                labelStyle={menuLabelFont}
                onClick={() =>
                  pushFromMenu(
                    p(
                      "/admin/contacts?kind=feature",
                      "/mobile/admin/inbox?kind=feature"
                    )
                  )
                }
                trailing={
                  <CountBadge count={adminInbox.feature} tone="admin" />
                }
              >
                <span className={cn(isEn && "uppercase")}>
                  {m.settings.adminFeatureRequests}
                </span>
              </SideMenuItemButton>

              <SideMenuItemButton
                icon={Mail}
                labelStyle={menuLabelFont}
                onClick={() =>
                  pushFromMenu(
                    p(
                      "/admin/contacts?kind=inbox",
                      "/mobile/admin/inbox?kind=inbox"
                    )
                  )
                }
                trailing={<CountBadge count={adminInbox.inbox} tone="admin" />}
              >
                <span className={cn(isEn && "uppercase")}>
                  {m.settings.adminContacts}
                </span>
              </SideMenuItemButton>

              <SideMenuItemButton
                icon={ShoppingBag}
                labelStyle={menuLabelFont}
                onClick={() =>
                  pushFromMenu(
                    p("/admin/redemptions", "/mobile/admin/redemptions")
                  )
                }
                trailing={
                  <CountBadge count={adminInbox.redemptions} tone="admin" />
                }
              >
                <span className={cn(isEn && "uppercase")}>
                  {m.settings.adminRedemptions}
                </span>
              </SideMenuItemButton>
            </div>
          </>
        )}

        <div className="relative mt-auto flex flex-col gap-2 pt-5 pb-1">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/25 to-transparent"
          />
          <SideMenuItemButton
            icon={Trash2}
            tone="danger"
            dense
            labelStyle={menuLabelFont}
            onClick={() =>
              pushFromMenu(
                resolvedVariant === "web"
                  ? "/web/settings/delete-account"
                  : "/mobile/settings/delete-account"
              )
            }
          >
            <span className={cn(isEn && "uppercase")}>
              {m.settings.deleteAccount}
            </span>
          </SideMenuItemButton>
          <SideMenuItemButton
            icon={LogOut}
            tone="danger"
            labelStyle={menuLabelFont}
            onClick={() => setShowLogoutModal(true)}
          >
            <span className={cn(isEn && "uppercase")}>{m.settings.logout}</span>
          </SideMenuItemButton>

          {/* 一番下: HUD アイデンティティ（アイコン・名前・プラン） */}
          {user?.uid ? (
            <button
              type="button"
              onClick={openProfileEditOverlay}
              className={cn(
                "side-menu-identity mt-2",
                plan === "pro" && "is-pro"
              )}
              aria-label={`${identityName} · ${planLabel}`}
            >
              <span aria-hidden className="side-menu-identity__scan" />

              <span
                className={cn(
                  "side-menu-identity__avatar",
                  plan === "pro" && "is-pro"
                )}
                aria-hidden
              >
                <span className="side-menu-identity__ring" />
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="side-menu-identity__img"
                    draggable={false}
                  />
                ) : (
                  <span className="side-menu-identity__initial">
                    {identityInitial}
                  </span>
                )}
              </span>

              <span className="side-menu-identity__meta">
                <span className="side-menu-identity__name-row">
                  <span className="side-menu-identity__name">{identityName}</span>
                  <RankingNameBadges
                    compact
                    isPro={plan === "pro"}
                    proLabel="PRO"
                    {...proBadgeStaticMotion}
                  />
                  {plan === "pro" ? null : (
                    <span
                      className={cn(
                        nameOxanium.className,
                        "side-menu-identity__badge"
                      )}
                    >
                      FREE
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    nameOxanium.className,
                    "side-menu-identity__sub"
                  )}
                >
                  <span className="side-menu-identity__dot" />
                  {handle ? `@${handle}` : "OPERATOR"}
                </span>
              </span>

              <span
                aria-hidden
                className={cn(
                  nameOxanium.className,
                  "side-menu-identity__caret"
                )}
              >
                ▸
              </span>
            </button>
          ) : null}
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
        !onOpenProfileEdit &&
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
