"use client";

import { FormEvent, useState } from "react";
import { officialContact, officialSite } from "@/lib/lp/officialSiteContent";
import OfficialLpReveal from "./OfficialLpReveal";

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
      <OfficialLpReveal>
        <div className="olp-wrap grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="olp-h2">{officialContact.heading}</h2>
            <p className="olp-lead">{officialContact.lead}</p>
            <a
              href={`mailto:${officialSite.supportEmail}`}
              className="mt-6 inline-block text-[1.15rem] font-semibold text-[var(--olp-accent)] no-underline"
            >
              {officialSite.supportEmail}
            </a>
            <div className="mt-5">
              <a
                href={`mailto:${officialSite.supportEmail}`}
                className="olp-btn olp-btn-solid"
              >
                Contact
              </a>
            </div>
          </div>

          <form
            className="grid gap-4"
            onSubmit={onSubmit}
          >
            <label className="grid gap-1.5 text-[13px] font-semibold text-[#c5d0e4]">
              お名前
              <input
                required
                name="name"
                autoComplete="name"
                className="min-h-11 rounded-xl border border-[var(--olp-border)] bg-[#0a1018] px-3 text-[15px] font-normal text-white"
              />
            </label>
            <label className="grid gap-1.5 text-[13px] font-semibold text-[#c5d0e4]">
              メールアドレス
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                className="min-h-11 rounded-xl border border-[var(--olp-border)] bg-[#0a1018] px-3 text-[15px] font-normal text-white"
              />
            </label>
            <label className="grid gap-1.5 text-[13px] font-semibold text-[#c5d0e4]">
              内容
              <textarea
                required
                name="message"
                rows={5}
                className="rounded-xl border border-[var(--olp-border)] bg-[#0a1018] px-3 py-2 text-[15px] font-normal text-white"
              />
            </label>
            <button type="submit" className="olp-btn olp-btn-ghost w-fit">
              メールで送る
            </button>
            {sentHint ? (
              <p className="m-0 text-[13px] text-[#9eabc9]">
                メールアプリが開きます。開かない場合は {officialSite.supportEmail}{" "}
                へ直接ご連絡ください。
              </p>
            ) : null}
          </form>
        </div>
      </OfficialLpReveal>
    </section>
  );
}
