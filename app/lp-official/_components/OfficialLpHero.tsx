"use client";

import PhoneMock from "@/app/lp/_components/PhoneMock";
import { officialHero, officialSite } from "@/lib/lp/officialSiteContent";
import OfficialLpReveal from "./OfficialLpReveal";

export default function OfficialLpHero() {
  return (
    <section id="top" className="olp-section pt-10 sm:pt-14">
      <OfficialLpReveal>
        <div className="olp-wrap grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.9fr)] lg:gap-16">
          <div>
            <p className="olp-kicker">{officialHero.kicker}</p>
            <h1
              className="m-0 text-[clamp(3.2rem,10vw,5.4rem)] leading-[0.92] tracking-[0.08em] text-white"
              style={{ fontFamily: "var(--font-auth-condensed), sans-serif" }}
            >
              {officialHero.title}
            </h1>
            <p className="mt-5 max-w-[36rem] text-[1.15rem] leading-8 text-[#d5deee] text-pretty">
              {officialHero.lead}
            </p>
            <ul className="mt-6 m-0 flex list-none flex-col gap-2.5 p-0">
              {officialHero.points.map((point) => (
                <li
                  key={point}
                  className="border border-[var(--olp-border)] bg-[rgba(16,24,38,0.55)] px-4 py-3 text-[0.95rem] leading-7 text-[#d7e0ef]"
                >
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="olp-btn olp-btn-solid" aria-disabled="true">
                {officialHero.ctaLabel}
              </span>
              <a href="#contact" className="olp-btn olp-btn-ghost">
                Contact
              </a>
            </div>
            <p className="mt-4 text-[13px] text-[#9eabc9]">
              運営サービス: {officialSite.company.service}
            </p>
          </div>

          <div className="justify-self-center">
            <PhoneMock
              src="/lp/ranking-v2.MP4"
              posterSrc="/lp/ranking-v2.png"
              videoBackdropSrc="/lp/ranking-v2.png"
              mediaType="video"
              alt="Uniterz ランキング画面のモックアップ"
              widthClassName="w-[min(280px,72vw)]"
              priority
              maskScreenshotStatusBar
            />
          </div>
        </div>
      </OfficialLpReveal>
    </section>
  );
}
