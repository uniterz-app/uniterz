"use client";

import { FormEvent, useState } from "react";
import { officialContact, officialSite } from "@/lib/lp/officialSiteContent";

export default function OfficialLpContact() {
  const [sentHint, setSentHint] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const subject = encodeURIComponent("Uniterz お問い合わせ");
    const body = encodeURIComponent(
      `名前: ${name}\nメール: ${email}\n\n${message}`
    );
    window.location.href = `mailto:${officialSite.supportEmail}?subject=${subject}&body=${body}`;
    setSentHint(true);
  };

  return (
    <section id="contact" className="olp-section">
      <div className="olp-wrap olp-contact-grid">
        <div>
          <p className="olp-h2-en olp-metric">{officialContact.heading}</p>
          <h2 className="olp-h2">{officialContact.headingJa}</h2>
          <p className="olp-lead">{officialContact.lead}</p>
          <a href={`mailto:${officialSite.supportEmail}`} className="olp-mail">
            {officialSite.supportEmail}
          </a>
        </div>

        <form className="olp-form" onSubmit={onSubmit}>
          <label>
            お名前
            <input required name="name" autoComplete="name" />
          </label>
          <label>
            メールアドレス
            <input required type="email" name="email" autoComplete="email" />
          </label>
          <label>
            内容
            <textarea required name="message" rows={5} />
          </label>
          <button type="submit" className="olp-btn olp-btn-solid w-fit">
            メールで送る
          </button>
          {sentHint ? (
            <p className="m-0 text-[13px] text-[#8b97ad]">
              メールアプリが開きます。開かない場合は {officialSite.supportEmail}{" "}
              へ直接ご連絡ください。
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
