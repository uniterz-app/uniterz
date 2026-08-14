import { officialWhat } from "@/lib/lp/officialSiteContent";

export default function OfficialLpWhat() {
  return (
    <section id="about" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialWhat.heading}</p>
        <h2 className="olp-h2">{officialWhat.headingJa}</h2>
        <p className="olp-what-statement">{officialWhat.statement}</p>
        <div className="olp-what-cols">
          <div>
            <h3>{officialWhat.purpose.title}</h3>
            <ul>
              {officialWhat.purpose.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{officialWhat.difference.title}</h3>
            <ul>
              {officialWhat.difference.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
