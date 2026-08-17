import { officialUnit } from "@/lib/lp/officialSiteContent";

export default function OfficialLpUnit() {
  return (
    <section id="unit" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialUnit.heading}</p>
        <h2 className="olp-h2">{officialUnit.headingJa}</h2>
        <p className="olp-what-statement">{officialUnit.statement}</p>
        <p className="olp-lead">{officialUnit.lead}</p>

        <div className="olp-unit-when">
          <h3>{officialUnit.when.title}</h3>
          <ul>
            {officialUnit.when.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="olp-what-cols">
          <div>
            <h3>{officialUnit.can.title}</h3>
            <ul>
              {officialUnit.can.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{officialUnit.cannot.title}</h3>
            <ul>
              {officialUnit.cannot.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
