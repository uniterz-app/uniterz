import { officialFairness } from "@/lib/lp/officialSiteContent";

export default function OfficialLpFairness() {
  return (
    <section id="fairness" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialFairness.heading}</p>
        <h2 className="olp-h2">{officialFairness.headingJa}</h2>
        <dl className="olp-dl">
          {officialFairness.items.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
