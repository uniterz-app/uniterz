"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { markAnnouncementRead } from "@/lib/announcements/markAnnouncementRead";
import {
  isAuthStateResolved,
  useFirebaseUser,
} from "@/lib/useFirebaseUser";
import {
  ANNOUNCEMENT_READ_IDS_STORAGE_KEY,
  ANNOUNCEMENT_READS_CHANGED_EVENT,
  getLocalAnnouncementReadIds,
} from "@/lib/announcements/localAnnouncementReads";
import {
  ANNOUNCEMENT_READS_REFRESH_EVENT,
  loadAnnouncementReadIdsFor,
} from "@/lib/announcements/loadAnnouncementReadIds";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { mergeSyntheticEventIntoAnnouncements } from "@/lib/announcements/inAppEventAnnouncement";
import {
  queryVisibleAnnouncementsNoOrder,
  sortAnnouncementsByPinnedThenPosted,
  VISIBLE_ANNOUNCEMENTS_FETCH_LIMIT,
} from "@/lib/announcements/announcementsClientQuery";

const MOBILE_ANNOUNCEMENTS_LIST_LIMIT = 20;

type Announcement = {
  id: string;
  title: string;
  heroImageURL?: string;
  type?: string; // event | campaign | update | maintenance | info
  postedAt?: Timestamp | Date | null;
  pinned?: boolean;
};

const TYPE_META: Record<string, { grad: string; glow: string }> = {
  event:       { grad: "from-[#00E5FF] to-[#0077FF]", glow: "shadow-[0_0_22px_rgba(0,229,255,0.35)]" },
  campaign:    { grad: "from-[#FF4DFF] to-[#A64DFF]", glow: "shadow-[0_0_22px_rgba(255,77,255,0.35)]" },
  update:      { grad: "from-[#9DFF00] to-[#3DFF75]", glow: "shadow-[0_0_22px_rgba(61,255,117,0.35)]" },
  maintenance: { grad: "from-[#FFC400] to-[#FF7A00]", glow: "shadow-[0_0_22px_rgba(255,122,0,0.35)]" },
  info:        { grad: "from-[#9CA3AF] to-[#6B7280]", glow: "shadow-[0_0_22px_rgba(156,163,175,0.25)]" },
};

const TYPE_LABEL_KEY: Record<string, "typeEvent" | "typeCampaign" | "typeUpdate" | "typeMaintenance" | "typeInfo"> = {
  event: "typeEvent",
  campaign: "typeCampaign",
  update: "typeUpdate",
  maintenance: "typeMaintenance",
  info: "typeInfo",
};

function formatDate(d?: Timestamp | Date | null) {
  if (!d) return "";
  const date = d instanceof Timestamp ? d.toDate() : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const MM = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${HH}:${MM}`;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // ログインユーザー（{ fUser, status }）
  const { fUser: user, status } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);

  // 既読ID集合
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // お知らせ読み込み
  useEffect(() => {
    (async () => {
      try {
        const q = queryVisibleAnnouncementsNoOrder(VISIBLE_ANNOUNCEMENTS_FETCH_LIMIT);
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Announcement[];
        const sorted = sortAnnouncementsByPinnedThenPosted(list);
        setItems(
          mergeSyntheticEventIntoAnnouncements(
            sorted.slice(0, MOBILE_ANNOUNCEMENTS_LIST_LIMIT)
          )
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 既読（ログイン: 一覧 ID だけ getDoc / ゲスト: localStorage）
  useEffect(() => {
    if (!isAuthStateResolved(status)) {
      setReadIds(new Set());
      return;
    }
    if (user?.uid) {
      let cancelled = false;
      const ids = items.map((x) => x.id);
      const refresh = async () => {
        const next = await loadAnnouncementReadIdsFor(db, user.uid!, ids);
        if (!cancelled) setReadIds(next);
      };
      void refresh();
      const onRefresh = () => {
        void refresh();
      };
      window.addEventListener(ANNOUNCEMENT_READS_REFRESH_EVENT, onRefresh);
      window.addEventListener(ANNOUNCEMENT_READS_CHANGED_EVENT, onRefresh);
      return () => {
        cancelled = true;
        window.removeEventListener(ANNOUNCEMENT_READS_REFRESH_EVENT, onRefresh);
        window.removeEventListener(ANNOUNCEMENT_READS_CHANGED_EVENT, onRefresh);
      };
    }
    const sync = () => setReadIds(getLocalAnnouncementReadIds());
    sync();
    const onCustom = () => sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === ANNOUNCEMENT_READ_IDS_STORAGE_KEY) sync();
    };
    window.addEventListener(ANNOUNCEMENT_READS_CHANGED_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ANNOUNCEMENT_READS_CHANGED_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [status, user?.uid, items]);

  const isUnread = useMemo(() => {
    if (!isAuthStateResolved(status)) return (_id: string) => false;
    return (id: string) => !readIds.has(id);
  }, [status, readIds]);

  return (
    <ProfileCyberPage
      title="NEWS"
      subtitle={
        language === "en"
          ? "Official announcements, events, and maintenance updates."
          : "公式のお知らせ・イベント・メンテナンス情報です。"
      }
      contentClassName="max-w-lg px-4 py-4"
    >
        {/* スケルトン */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden bg-white/5 border border-white/10"
              >
                <div className="h-44 w-full skeleton-scan bg-white/10" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-20 bg-white/10 skeleton-scan rounded" />
                  <div className="h-5 w-4/5 bg-white/10 skeleton-scan rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="text-center text-sm text-white/60 mt-10">
            {m.settings.noAnnouncements}
          </p>
        )}

        {!loading &&
          items.map((a) => {
            const src = (a.heroImageURL ?? "").trim().replace(/\s+/g, "%20");
            const typeKey = a.type ?? "info";
            const meta = TYPE_META[typeKey];
            const typeLabel = m.settings[TYPE_LABEL_KEY[typeKey] ?? "typeInfo"];
            const unread = isUnread(a.id);

            return (
              <Link
                href={`/mobile/announcements/${a.id}`}
                key={a.id}
                onClick={() => {
                  if (isAuthStateResolved(status)) {
                    markAnnouncementRead(user?.uid ?? null, a.id);
                  }
                }}
              >
                <div
                  className={[
                    "relative rounded-2xl overflow-hidden mb-5 border border-white/10 bg-white/5",
                    "transition-transform duration-150 active:scale-[0.99]",
                    "hover:shadow-[0_0_40px_rgba(0,229,255,0.10),0_0_80px_rgba(164,77,255,0.06)]",
                  ].join(" ")}
                >
                  {/* 未読ドット */}
                  {unread && (
                    <span
                      className="pointer-events-none absolute right-2 top-2 z-20 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.8)]"
                      aria-label={m.settings.unread}
                    />
                  )}

                  {src ? (
                    <Image
                      src={src}
                      alt={a.title}
                      width={800}
                      height={450}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-44 w-full bg-white/5" />
                  )}

                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold bg-linear-to-r ${meta.grad} text-black/90 ${meta.glow}`}
                      >
                        {typeLabel}
                      </span>
                      <span className="text-xs text-white/60">
                        {formatDate(a.postedAt)}
                      </span>
                    </div>
                    <h2 className="mt-1 text-base font-semibold leading-tight">
                      {a.title}
                    </h2>
                  </div>
                </div>
              </Link>
            );
          })}
    </ProfileCyberPage>
  );
}
