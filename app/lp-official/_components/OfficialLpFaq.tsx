import { officialFaq } from "@/lib/lp/officialSiteContent";

export default function OfficialLpFaq() {
  return (
    <section id="faq" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialFaq.heading}</p>
        <h2 className="olp-h2">{officialFaq.headingJa}</h2>
        <div className="olp-faq">
          {officialFaq.items.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
