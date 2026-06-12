"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { isAuthStateResolved, useFirebaseUser } from "@/lib/useFirebaseUser";
import { markAnnouncementRead } from "@/lib/announcements/markAnnouncementRead";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { ChevronLeft } from "lucide-react";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import EventNoticeBody from "@/app/component/events/EventNoticeBody";
import {
  getSyntheticEventById,
  isInAppEventAnnouncementDetail,
} from "@/lib/announcements/inAppEventAnnouncement";

/* 一覧と同じマッピング */
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

type Ann = {
  title: string;
  body?: string;
  heroImageURL?: string;
  type?: string; // "event" | "campaign" | "update" | "maintenance" | "info"
  postedAt?: Timestamp;
};

function formatDate(d?: Timestamp) {
  if (!d) return "";
  const date = d.toDate();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const MM = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${HH}:${MM}`;
}

export default function WebAnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { fUser: user, status } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);

  const [a, setA] = useState<Ann | null>(null);
  /** Firestore に無くアプリ内イベントで表示している */
  const [syntheticEvent, setSyntheticEvent] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing">(
    "loading"
  );

  // 取得
  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      const ref = doc(db, "announcements", id);
      const snap = await getDoc(ref);
      if (!alive) return;
      if (snap.exists()) {
        setA(snap.data() as Ann);
        setSyntheticEvent(false);
        setLoadState("ready");
        return;
      }
      if (isInAppEventAnnouncementDetail(id)) {
        setA(null);
        setSyntheticEvent(true);
        setLoadState("ready");
        return;
      }
      setA(null);
      setSyntheticEvent(false);
      setLoadState("missing");
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // 既読（ログイン: Firestore / ゲスト: localStorage）。表示できたときだけ
  useEffect(() => {
    if (!isAuthStateResolved(status) || !id || loadState !== "ready") return;
    markAnnouncementRead(user?.uid ?? null, id);
  }, [status, user?.uid, id, loadState]);

  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-white">
        <div className="mx-auto flex max-w-[840px] justify-center px-5 py-10">
          <CandleChartLoader label={m.common.loading} />
        </div>
      </div>
    );
  }

  const syntheticContent =
    syntheticEvent && id ? getSyntheticEventById(id) : undefined;

  if (
    loadState === "missing" ||
    (!a && !syntheticEvent) ||
    (syntheticEvent && !syntheticContent)
  ) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-white">
        <div className="mx-auto max-w-[840px] px-5 py-10">
          <p className="text-white/60">
            {m.settings.announcementNotFound}
          </p>
        </div>
      </div>
    );
  }

  const typeKey = syntheticEvent ? "event" : (a?.type ?? "info");
  const meta = TYPE_META[typeKey];
  const typeLabel = m.settings[TYPE_LABEL_KEY[typeKey] ?? "typeInfo"];
  const postedAtTs = syntheticContent
    ? Timestamp.fromMillis(syntheticContent.postedAtMs)
    : a?.postedAt;
  const title = syntheticContent
    ? (language === "en" && syntheticContent.titleEn
        ? syntheticContent.titleEn
        : syntheticContent.title)
    : a!.title;
  const src = syntheticEvent
    ? ""
    : (a!.heroImageURL ?? "").trim().replace(/\s+/g, "%20");

  return (
    <div className="relative min-h-screen text-white">
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-[#0B0F17]" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 16% 0%, rgba(0,229,255,0.10) 0%, rgba(0,0,0,0) 60%), radial-gradient(50% 40% at 100% 10%, rgba(164,77,255,0.08) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      {/* header */}
      <div className="sticky top-0 z-10 backdrop-blur supports-backdrop-filter:bg-[#0B0F17]/70 border-b border-white/5">
        <div className="mx-auto max-w-[840px] px-5">
          <div className="flex items-center gap-3 py-4">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95"
              aria-label={m.common.back}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">{m.settings.news}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[840px] px-5 py-6">
        {syntheticEvent && syntheticContent ? (
          <>
            <div className="mt-0 flex items-center gap-3">
              <span
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold bg-linear-to-r ${meta.grad} text-black/90 ${meta.glow}`}
              >
                {typeLabel}
              </span>
              <span className="text-xs text-white/60">
                {formatDate(postedAtTs)}
              </span>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.35)] bg-[#120818]/90">
              <EventNoticeBody
                event={syntheticContent}
                heroHeight={320}
                isEn={language === "en"}
              />
            </div>
          </>
        ) : (
          <>
            {src && (
              <Image
                src={src}
                alt={title}
                width={1440}
                height={810}
                className="w-full h-[320px] object-cover rounded-2xl border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.35)]"
                priority
              />
            )}

            <div className="mt-4 flex items-center gap-3">
              <span
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold bg-linear-to-r ${meta.grad} text-black/90 ${meta.glow}`}
              >
                {typeLabel}
              </span>
              <span className="text-xs text-white/60">
                {formatDate(postedAtTs)}
              </span>
            </div>

            <h2 className="text-2xl font-bold mt-2 leading-snug">{title}</h2>

            <div className="mt-4 text-[15px] leading-relaxed whitespace-pre-wrap text-white/90">
              {a!.body ?? ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
