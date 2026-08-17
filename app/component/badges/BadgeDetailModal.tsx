"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { DATE_LOCALE } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameOxanium } from "@/lib/fonts";
import {
  badgeParticipantLabel,
  formatBadgeParticipantCount,
  readBadgeParticipantCount,
} from "@/lib/badges/badgeCohort";
import VelvetTuftField from "./VelvetTuftField";
import "./badgeDetailModal.css";

function subscribeToBody() {
  return () => {};
}

function getBodySnapshot(): HTMLElement | null {
  return typeof document !== "undefined" ? document.body : null;
}

function getBodyServerSnapshot(): null {
  return null;
}

function useDocumentBody(): HTMLElement | null {
  return useSyncExternalStore(
    subscribeToBody,
    getBodySnapshot,
    getBodyServerSnapshot,
  );
}

export type BadgeDetailModalProps = {
  badge: any;
  onClose: () => void;
  language?: Language;
  /** バッジ画像の浮遊アニメ（モバイル向け） */
  shine?: boolean;
};

function resolveAwardedMs(badge: any): number | null {
  const a = badge?.awardedAt;
  if (a && typeof a.toMillis === "function") return a.toMillis();
  if (typeof a === "number") return a;
  const g = badge?.grantedAt;
  if (g instanceof Date) return g.getTime();
  if (typeof g === "number") return g;
  return null;
}

export default function BadgeDetailModal({
  badge,
  onClose,
  language = "ja",
  shine = false,
}: BadgeDetailModalProps) {
  const m = t(language);
  const awardedMs = resolveAwardedMs(badge);
  const participantCount = readBadgeParticipantCount(badge);
  const portalRoot = useDocumentBody();
  const isJa = language === "ja";

  useLayoutEffect(() => {
    if (!portalRoot) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [portalRoot]);

  const overlay = (
    <div
      className="badge-detail-modal"
      role="dialog"
      aria-modal
      aria-labelledby="badge-detail-modal-title"
    >
      <button
        type="button"
        className="badge-detail-modal__backdrop"
        onClick={onClose}
        aria-label={m.common.close}
      />

      <div
        className="badge-detail-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="badge-detail-modal__close"
          onClick={onClose}
          aria-label={m.common.close}
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        </button>

        <div className="badge-detail-modal__hero-stage">
          <div className="badge-detail-modal__quilt" aria-hidden>
            <VelvetTuftField />
          </div>
          {badge.icon ? (
            <div className="badge-detail-modal__hero">
              <div className="badge-detail-modal__hero-glow" aria-hidden />
              <img
                src={badge.icon}
                alt={badge.title ?? badge.id}
                className={[
                  "badge-detail-modal__badge-img",
                  shine ? "badge-detail-modal__badge-img--float" : "",
                ].join(" ")}
              />
            </div>
          ) : null}
        </div>

        <div className="badge-detail-modal__copy">
          <p className="badge-detail-modal__kicker">
            {isJa ? "バッジ" : "Badge"}
          </p>

          <h2
            id="badge-detail-modal-title"
            className={[nameOxanium.className, "badge-detail-modal__title"].join(" ")}
          >
            {badge.title ?? badge.id}
          </h2>

          {badge.description ? (
            <p className="badge-detail-modal__desc">{badge.description}</p>
          ) : null}

          {awardedMs != null || participantCount != null ? (
            <div className="badge-detail-modal__meta">
              {awardedMs != null ? (
                <p className="badge-detail-modal__meta-row">
                  <span className="badge-detail-modal__meta-label">
                    {isJa ? "付与日" : "Granted"}
                  </span>
                  <span className="badge-detail-modal__meta-value" aria-hidden>
                    ·
                  </span>
                  <span className="badge-detail-modal__meta-value">
                    {new Date(awardedMs).toLocaleDateString(DATE_LOCALE[language])}
                  </span>
                </p>
              ) : null}
              {participantCount != null ? (
                <p className="badge-detail-modal__meta-row">
                  <span className="badge-detail-modal__meta-label">
                    {badgeParticipantLabel(isJa ? "ja" : "en")}
                  </span>
                  <span className="badge-detail-modal__meta-value" aria-hidden>
                    ·
                  </span>
                  <span className="badge-detail-modal__meta-value">
                    {formatBadgeParticipantCount(
                      participantCount,
                      isJa ? "ja" : "en",
                    )}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!portalRoot) return null;
  return createPortal(overlay, portalRoot);
}
