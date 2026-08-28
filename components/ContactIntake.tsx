"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { createContactMailto } from "../lib/contact-request.mjs";
import styles from "./contact-intake.module.css";

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export default function ContactIntake() {
  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    window.location.assign(createContactMailto({
      nameCompany: value(formData, "nameCompany"),
      websiteUrl: value(formData, "websiteUrl"),
      reviewContext: value(formData, "reviewContext"),
      websiteCount: value(formData, "websiteCount"),
      targetDate: value(formData, "targetDate"),
      decision: value(formData, "decision")
    }));
  }

  return <section className={styles.section} aria-labelledby="audit-request-title">
    <div className={styles.heading}>
      <div>
        <p className="eyebrow">Two-minute request</p>
        <h2 id="audit-request-title">Prepare a complete audit request.</h2>
      </div>
      <p>Answer the essentials once. We turn them into a structured email so scope, timing and the decision you need are clear from the start.</p>
    </div>

    <form className={styles.form} onSubmit={prepareEmail}>
      <div className={styles.fieldWide}>
        <label htmlFor="name-company">Name and company</label>
        <input id="name-company" name="nameCompany" type="text" maxLength={160} autoComplete="name" placeholder="Your name · Company" required />
      </div>

      <div className={styles.fieldWide}>
        <label htmlFor="website-url">Public website URL</label>
        <input id="website-url" name="websiteUrl" type="url" maxLength={500} inputMode="url" autoComplete="url" placeholder="https://your-website.com" required />
        <small>Only enter a public URL you are authorized to have reviewed.</small>
      </div>

      <div>
        <label htmlFor="review-context">Review context</label>
        <select id="review-context" name="reviewContext" defaultValue="" required>
          <option value="" disabled>Select one</option>
          <option>Public launch decision</option>
          <option>Client handoff</option>
          <option>Redesign or relaunch</option>
          <option>Agency or portfolio quality review</option>
          <option>Other business review</option>
        </select>
      </div>

      <div>
        <label htmlFor="website-count">Number of websites</label>
        <select id="website-count" name="websiteCount" defaultValue="1" required>
          <option value="1">1 website</option>
          <option value="2–5">2–5 websites</option>
          <option value="6+">6 or more websites</option>
        </select>
      </div>

      <div className={styles.fieldWide}>
        <label htmlFor="target-date">Target date <span>optional</span></label>
        <input id="target-date" name="targetDate" type="text" maxLength={80} placeholder="For example: before our launch on 15 September" />
      </div>

      <div className={styles.fieldWide}>
        <label htmlFor="decision">What decision should the audit support?</label>
        <textarea id="decision" name="decision" rows={5} maxLength={1200} placeholder="Tell us what must be launch-ready, what you are uncertain about, or what a client needs to approve." required />
      </div>

      <label className={`${styles.confirmation} ${styles.fieldWide}`}>
        <input name="businessConfirmation" type="checkbox" required />
        <span>I am requesting this exclusively in a business or self-employed capacity and am authorized to have this public URL reviewed.</span>
      </label>

      <div className={`${styles.submitRow} ${styles.fieldWide}`}>
        <button type="submit">Prepare email request <span aria-hidden="true">→</span></button>
        <p><strong>Nothing is sent by this form.</strong> Your mail program opens with the request prepared, and you decide whether to send it. See our <Link href="/privacy">privacy notice</Link>.</p>
      </div>
    </form>
  </section>;
}
