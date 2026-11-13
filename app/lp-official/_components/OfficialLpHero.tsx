import { officialHero, officialHeroScreens } from "@/lib/lp/officialSiteContent";
import OfficialLpLoginCta from "./OfficialLpLoginCta";
import OfficialLpShot from "./OfficialLpShot";
import OfficialLpStoreLinks from "./OfficialLpStoreLinks";

export default function OfficialLpHero() {
  const { left, leftBack, right } = officialHeroScreens;

  return (
    <section id="top" className="olp-section olp-hero">
      <div className="olp-hero-stage olp-hero-enter">
        <h1 className="olp-hero-catch">{officialHero.catch}</h1>

        <div className="olp-hero-phones">
          <div className="olp-hero-phone olp-hero-phone-back">
            <OfficialLpShot
              src={leftBack.src}
              alt={leftBack.alt}
              className="olp-hero-shot olp-hero-shot-back"
              sizes="200px"
            />
          </div>
          <div className="olp-hero-phone olp-hero-phone-games">
            <OfficialLpShot
              src={left.src}
              alt={left.alt}
              priority
              className="olp-hero-shot"
              sizes="(max-width: 1023px) 46vw, 240px"
            />
            <p className="olp-hero-phone-label olp-metric">{left.label}</p>
          </div>
          <div className="olp-hero-phone olp-hero-phone-rank">
            <OfficialLpShot
              src={right.src}
              alt={right.alt}
              priority
              className="olp-hero-shot"
              sizes="(max-width: 1023px) 46vw, 240px"
            />
            <p className="olp-hero-phone-label olp-metric">{right.label}</p>
          </div>
        </div>

        <p className="olp-hero-lead">{officialHero.lead}</p>

        <div className="olp-hero-actions">
          <OfficialLpStoreLinks />
          <div className="olp-hero-subacts">
            <OfficialLpLoginCta className="olp-hero-login" />
            <a href="#contact" className="olp-hero-contact">
              Contact
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
