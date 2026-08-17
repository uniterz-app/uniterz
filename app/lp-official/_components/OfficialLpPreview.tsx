import { officialPreview } from "@/lib/lp/officialSiteContent";
import OfficialLpShot from "./OfficialLpShot";

export default function OfficialLpPreview() {
  return (
    <section id="preview" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialPreview.heading}</p>
        <h2 className="olp-h2">{officialPreview.headingJa}</h2>
        <p className="olp-lead">{officialPreview.lead}</p>
      </div>
      <div className="olp-shot-row">
        {officialPreview.screens.map((screen) => (
          <figure key={screen.id} className="olp-shot-item">
            <OfficialLpShot src={screen.src} alt={screen.alt} />
            <figcaption className="olp-metric mt-3 text-center text-[12px] font-semibold tracking-[0.12em] text-[#c5d0e4]">
              {screen.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
