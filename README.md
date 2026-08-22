# Site-Health CRM (#17)

The Lighthouse score becomes a tracked metric, re-scanned on a schedule, with a flagged upsell path
to a redesign. Sixth Hybrid CRM.

`LighthouseScan` ported field-for-field from Audit Magnet CRM (`#11`)'s scanning engine — no changes
needed. Paired with a plain `Client` (crm3-micro-style) instead of a scraped `Lead`, since this
product monitors *your own clients'* sites over time, not a one-off prospecting scan.

**Recurring mechanic deliberately differs from Patient CRM's (`#07`) established `CareReminder`
pattern**: there, firing a reminder only sends a notification and does NOT reschedule the next one,
because only a real vet visit (a human, real-world action) knows the true next due date. Here a site
re-scan is fully deterministic — no such ambiguity — so `POST /scan-reminders/process-due` performs
the scan itself AND reschedules the next reminder in the same action, same as a cron job would (still
manually triggered — no cron infrastructure anywhere in this catalog, same honesty as everywhere
else). `EmailTemplate`/`EmailLog` weren't reused here — not named on the catalog card (only
`LighthouseScan (recurring)` and `Client` are) and this product's "upsell path" is a data signal
(`needsRedesign` flag, computed from the latest score) for the agency's own outreach, not an
automated customer-facing email.

## Local dev

Backend: `:3320`. Frontend: `:5194`.

```
npm install
npm run prisma:generate
npx prisma migrate dev --name init
npm run dev
```

```
cd frontend
npm install
npm run dev
```
