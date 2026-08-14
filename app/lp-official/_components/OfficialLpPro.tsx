import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { officialPro } from "@/lib/lp/officialSiteContent";
import OfficialLpShot from "./OfficialLpShot";

export default function OfficialLpPro() {
  return (
    <section id="pro" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialPro.heading}</p>
        <h2 className="olp-h2">{officialPro.headingJa}</h2>
        <p className="olp-lead">{officialPro.lead}</p>
        <p className="olp-lead">{officialPro.revenue}</p>

        <div className="olp-plans">
          {officialPro.plans.map((plan) => (
            <article
              key={plan.id}
              className={[
                "olp-plan",
                "olp-frame",
                plan.variant === "pro" ? "pro" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <h3 className="olp-metric olp-plan-title">
                {plan.name}
                {plan.variant === "pro" ? (
                  <ProCyberBadge
                    {...proBadgeStaticMotion}
                    compact
                    ariaLabel="PRO"
                  />
                ) : null}
              </h3>
              <p className="price olp-metric">
                {plan.price}
                <span>{plan.period}</span>
              </p>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="olp-price-note">{officialPro.priceNote}</p>
        <p className="olp-same">{officialPro.sameRules}</p>

        {officialPro.features.map((feature, index) => {
          const shots = "shots" in feature ? feature.shots : [];
          const points = "points" in feature ? feature.points : [];
          const reports = "reports" in feature ? feature.reports : [];
          const reverse = index % 2 === 1 && shots.length > 0;

          return (
            <article
              key={feature.id}
              className={["olp-pro-feat", reverse ? "is-reverse" : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="olp-pro-feat-copy">
                <p className="olp-pro-kicker olp-metric">{feature.kicker}</p>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                {points.length > 0 ? (
                  <ul>
                    {points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
                {reports.length > 0 ? (
                  <div className="olp-pro-reports">
                    {reports.map((report) => (
                      <div key={report.name}>
                        <p className="olp-metric">{report.name}</p>
                        <p className="olp-pro-report-plan">{report.plan}</p>
                        <p>{report.text}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {shots.length > 0 ? (
                <div className="olp-pro-feat-phones">
                  {shots.map((shot) => (
                    <OfficialLpShot
                      key={shot.src}
                      src={shot.src}
                      alt={shot.alt}
                      className="olp-pro-phone"
                      sizes="(max-width: 719px) 46vw, 176px"
                    />
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}

        <div className="olp-table-wrap">
          <table className="olp-table">
            <caption className="olp-sr">Free と Pro の機能比較</caption>
            <thead>
              <tr>
                <th>機能</th>
                <th>Free</th>
                <th>Pro</th>
              </tr>
            </thead>
            <tbody>
              {officialPro.rows.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  <td>{row.free}</td>
                  <td>{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
