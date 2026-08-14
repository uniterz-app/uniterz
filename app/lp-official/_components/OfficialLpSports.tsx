import { officialSports } from "@/lib/lp/officialSiteContent";

export default function OfficialLpSports() {
  return (
    <section id="leagues" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialSports.heading}</p>
        <h2 className="olp-h2">{officialSports.headingJa}</h2>
        <div className="olp-league olp-frame">
          <p>{officialSports.current}</p>
          <p className="sub">{officialSports.future}</p>
          <p className="disc">{officialSports.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
