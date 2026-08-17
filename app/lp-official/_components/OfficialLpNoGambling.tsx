import { officialNoGambling } from "@/lib/lp/officialSiteContent";

export default function OfficialLpNoGambling() {
  return (
    <section id="no-betting" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialNoGambling.heading}</p>
        <h2 className="olp-h2">{officialNoGambling.headingJa}</h2>
        <p className="olp-ban-lead">{officialNoGambling.lead}</p>
        <ol className="olp-ban-rules">
          {officialNoGambling.rules.map((rule) => (
            <li key={rule.no} className="olp-frame">
              <p className="no olp-metric">{rule.no}</p>
              <h3>{rule.title}</h3>
              <p>{rule.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
