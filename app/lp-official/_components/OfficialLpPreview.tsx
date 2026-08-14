"use client";

import PhoneMock from "@/app/lp/_components/PhoneMock";
import { officialPreview } from "@/lib/lp/officialSiteContent";
import OfficialLpReveal from "./OfficialLpReveal";

export default function OfficialLpPreview() {
  return (
    <section id="preview" className="olp-section">
      <OfficialLpReveal>
        <div className="olp-wrap">
          <h2 className="olp-h2">{officialPreview.heading}</h2>
          <p className="olp-lead">{officialPreview.lead}</p>
        </div>

        <div className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1rem,calc((100%-1120px)/2))] pb-4">
          {officialPreview.screens.map((screen) => (
            <figure
              key={screen.id}
              className="m-0 w-[min(240px,70vw)] shrink-0 snap-center"
            >
              <PhoneMock
                src={
                  screen.type === "video" && "videoSrc" in screen
                    ? screen.videoSrc
                    : screen.src
                }
                posterSrc={screen.src}
                videoBackdropSrc={screen.src}
                mediaType={screen.type}
                alt={screen.alt}
                widthClassName="w-full"
                maskScreenshotStatusBar
              />
              <figcaption className="mt-4 text-center text-[13px] font-semibold tracking-[0.08em] text-[#c5d0e4]">
                {screen.label}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="olp-wrap mt-8 text-[13px] text-[#9eabc9]">
          追加予定: {officialPreview.coming.join(" / ")}
        </p>
      </OfficialLpReveal>
    </section>
  );
}
