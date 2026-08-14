import { officialHero, officialHeroScreens, officialSite } from "@/lib/lp/officialSiteContent";
import OfficialLpLogo from "./OfficialLpLogo";
import OfficialLpLoginCta from "./OfficialLpLoginCta";
import OfficialLpShot from "./OfficialLpShot";

export default function OfficialLpHero() {
  const { left, leftBack, right } = officialHeroScreens;
  const mobileShots = [left, leftBack, right];

  return (
    <section id="top" className="olp-section olp-hero">
      <div className="olp-hero-stage olp-hero-enter">
        <div className="olp-hero-copy">
          <p className="olp-status olp-metric">
            <span aria-hidden />
            {officialSite.appStore.label}
          </p>
          <div className="olp-logo-hero">
            <OfficialLpLogo priority centered />
          </div>
          <h1 className="olp-hero-catch">{officialHero.catch}</h1>
          <p className="olp-hero-lead">{officialHero.lead}</p>
          <div className="olp-hero-cta">
            <OfficialLpLoginCta />
            <a href="#contact" className="olp-btn olp-btn-ghost">
              Contact
            </a>
          </div>
        </div>

        <div className="olp-hero-mobile">
          {mobileShots.map((shot) => (
            <OfficialLpShot
              key={shot.src}
              src={shot.src}
              alt={shot.alt}
              priority
              className="olp-hero-mobile-shot"
              sizes="(max-width: 1023px) 56vw, 220px"
            />
          ))}
        </div>

        <div className="olp-hero-desktop">
          <div className="olp-hero-side olp-hero-side-left">
            <div className="olp-hero-phone olp-hero-phone-back">
              <OfficialLpShot
                src={leftBack.src}
                alt={leftBack.alt}
                className="olp-hero-shot olp-hero-shot-back"
                sizes="158px"
              />
            </div>
            <div className="olp-hero-phone olp-hero-phone-front">
              <OfficialLpShot
                src={left.src}
                alt={left.alt}
                className="olp-hero-shot"
                sizes="210px"
              />
            </div>
          </div>

          <div className="olp-hero-side olp-hero-side-right">
            <div className="olp-hero-phone olp-hero-phone-front">
              <OfficialLpShot
                src={right.src}
                alt={right.alt}
                className="olp-hero-shot"
                sizes="210px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
