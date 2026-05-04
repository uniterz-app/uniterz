"use client";

import type { EventNoticeContent } from "@/lib/events/eventNoticeTypes";

type Props = {
  event: Pick<
    EventNoticeContent,
    | "tag"
    | "tagEn"
    | "title"
    | "titleEn"
    | "description"
    | "descriptionEn"
    | "period"
    | "periodEn"
    | "target"
    | "targetEn"
    | "reward"
    | "rewardEn"
  > & { heroImageURL?: string };
  /** モーダル用のヘッダー画像の高さ（px） */
  heroHeight?: number;
  /** true のとき角丸は親（モーダル）に合わせ、本文上に区切り線のみ */
  embedInModal?: boolean;
  /** true のとき titleEn 等があれば英語を優先 */
  isEn?: boolean;
};

function pickLocalized(
  event: Props["event"],
  isEn: boolean
): Pick<
  EventNoticeContent,
  "tag" | "title" | "description" | "period" | "target" | "reward"
> & { heroImageURL?: string } {
  return {
    heroImageURL: event.heroImageURL,
    tag: isEn && event.tagEn ? event.tagEn : event.tag,
    title: isEn && event.titleEn ? event.titleEn : event.title,
    description:
      isEn && event.descriptionEn ? event.descriptionEn : event.description,
    period: isEn && event.periodEn ? event.periodEn : event.period,
    target:
      isEn && event.targetEn !== undefined ? event.targetEn : event.target,
    reward:
      isEn && event.rewardEn !== undefined ? event.rewardEn : event.reward,
  };
}

/**
 * EventModal とお知らせ詳細で共通の本文（ヘッダー画像＋タグ・本文・期間など）
 */
const DEFAULT_HERO = "/event/eventheader.png";

export default function EventNoticeBody({
  event,
  heroHeight = 160,
  embedInModal = false,
  isEn = false,
}: Props) {
  const loc = pickLocalized(event, isEn);
  const heroSrc = loc.heroImageURL ?? DEFAULT_HERO;
  const bodyClass = embedInModal
    ? "p-4 space-y-4 border-t border-white/10"
    : "p-4 space-y-4";

  return (
    <>
      <div className="relative overflow-hidden">
        <img
          src={heroSrc}
          alt=""
          className="w-full object-cover"
          style={{ height: heroHeight }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.6))",
          }}
        />
      </div>

      <div className={bodyClass}>
        {loc.tag && (
          <span
            className="inline-block px-3 py-1 text-[10px] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #4F8BFF 0%, #5CF0FF 100%)",
              color: "#FFFFFF",
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            {loc.tag}
          </span>
        )}

        <h2 className="text-lg font-bold text-white leading-snug">
          {loc.title}
        </h2>

        <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/90">
          {loc.description}
        </p>

        <div className="space-y-3 text-sm text-white">
          <div>
            <div className="text-[11px] tracking-widest text-white/70">
              PERIOD
            </div>
            <div>{loc.period}</div>
          </div>

          {loc.target && (
            <div>
              <div className="text-[11px] tracking-widest text-white/70">
                TARGET
              </div>
              <div>{loc.target}</div>
            </div>
          )}

          {loc.reward && (
            <div>
              <div className="text-[11px] tracking-widest text-white/70">
                REWARD
              </div>
              <div>{loc.reward}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
