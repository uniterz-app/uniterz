import { officialLegal } from "@/lib/lp/officialSiteContent";

export default function OfficialLpLegal() {
  return (
    <section id="legal" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialLegal.heading}</p>
        <h2 className="olp-h2">{officialLegal.headingJa}</h2>
        <p className="olp-lead">{officialLegal.lead}</p>
        <ul className="olp-legal-list">
          {officialLegal.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <nav className="olp-legal-links" aria-label="法務関連ページ">
          {officialLegal.links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
