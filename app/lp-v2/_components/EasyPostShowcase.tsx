"use client";

import { useState } from "react";
import PhoneMock from "@/app/lp/_components/PhoneMock";
import { heroMediaViews } from "@/app/lp/_components/lp-data";

function pickVideoBackdrop(
  m: (typeof heroMediaViews)[number]["media"]
): string | undefined {
  return "videoBackdropSrc" in m ? m.videoBackdropSrc : undefined;
}

type EasyPostShowcaseProps = {
  mobile?: boolean;
};

export default function EasyPostShowcase({
  mobile = false,
}: EasyPostShowcaseProps) {
  const [activeView, setActiveView] = useState<(typeof heroMediaViews)[number]["key"]>(
    "post"
  );
  const activeIndex = heroMediaViews.findIndex((v) => v.key === activeView);
  const active = heroMediaViews[activeIndex]!;
  const left =
    heroMediaViews[(activeIndex + heroMediaViews.length - 1) % heroMediaViews.length]!;
  const right = heroMediaViews[(activeIndex + 1) % heroMediaViews.length]!;

  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className={`relative ${mobile ? "h-[340px]" : "h-[600px] lg:h-[640px]"}`}>
        <div
          className={`absolute left-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/8 blur-3xl ${
            mobile ? "top-[42%]" : "top-[38%]"
          }`}
        />

        <div className={`absolute z-10 ${mobile ? "left-[13%] top-[18%]" : "left-[4%] top-[31%]"}`}>
          <div style={{ transform: "translate(-8px, 8px) rotate(-9deg)" }}>
            <PhoneMock
              src={left.media.src}
              mediaType={left.media.type}
              posterSrc={left.media.poster}
              videoBackdropSrc={pickVideoBackdrop(left.media)}
              alt={`${left.label} UI`}
              widthClassName={mobile ? "w-[90px]" : "w-[148px]"}
              glowClassName="from-transparent via-transparent to-transparent"
              imageClassName="brightness-[0.9] saturate-[0.95]"
              frameClassName={
                mobile
                  ? "rounded-[20px] p-[5px] opacity-[0.78]"
                  : "rounded-[26px] p-[6px] opacity-[0.82]"
              }
              screenClassName={mobile ? "rounded-[14px]" : "rounded-[18px]"}
              bezelClassName={mobile ? "rounded-[19px]" : "rounded-[25px]"}
              notchClassName={
                mobile ? "top-[4px] h-[11px] w-[35%]" : "top-[4px] h-[14px] w-[35%]"
              }
              tiltClassName="opacity-[0.55]"
              imagePosition={left.media.imagePosition}
              maskScreenshotStatusBar
            />
          </div>
        </div>

        <div className={`absolute z-10 ${mobile ? "right-[13%] top-[18%]" : "right-[5%] top-[33%]"}`}>
          <div style={{ transform: "translate(6px, 6px) rotate(8deg)" }}>
            <PhoneMock
              src={right.media.src}
              mediaType={right.media.type}
              posterSrc={right.media.poster}
              videoBackdropSrc={pickVideoBackdrop(right.media)}
              alt={`${right.label} UI`}
              widthClassName={mobile ? "w-[90px]" : "w-[138px]"}
              glowClassName="from-transparent via-transparent to-transparent"
              imageClassName="brightness-[0.9] saturate-[0.95]"
              frameClassName={
                mobile
                  ? "rounded-[20px] p-[5px] opacity-[0.78]"
                  : "rounded-[26px] p-[6px] opacity-[0.82]"
              }
              screenClassName={mobile ? "rounded-[14px]" : "rounded-[18px]"}
              bezelClassName={mobile ? "rounded-[19px]" : "rounded-[25px]"}
              notchClassName={
                mobile ? "top-[4px] h-[11px] w-[35%]" : "top-[4px] h-[14px] w-[35%]"
              }
              tiltClassName="opacity-[0.55]"
              imagePosition={right.media.imagePosition}
              maskScreenshotStatusBar
            />
          </div>
        </div>

        <div className={`absolute left-1/2 z-20 -translate-x-1/2 ${mobile ? "top-[4%]" : "top-[13%]"}`}>
          <div>
            <PhoneMock
              src={active.media.src}
              mediaType={active.media.type}
              posterSrc={active.media.poster}
              videoBackdropSrc={pickVideoBackdrop(active.media)}
              alt={`${active.label} UI`}
              widthClassName={mobile ? "w-[112px]" : "w-[190px]"}
              glowClassName="from-cyan-400/10 via-sky-400/6 to-cyan-200/4"
              imageClassName="brightness-[1] saturate-[1.02]"
              imagePosition={active.media.imagePosition}
              priority
              maskScreenshotStatusBar
            />
          </div>
        </div>
      </div>
    </div>
  );
}

