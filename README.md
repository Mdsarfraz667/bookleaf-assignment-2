# BookLeaf Assignment 2 — Author Royalty Dashboard & Automated Notification System

**Stack:** Bubble.io (app) + n8n (automation) + OpenAI (`gpt-4o-mini`)  
**Dataset:** `data/bookleaf_sample_data.json` (same as Assignment 1 — 10 authors, 18 books)  
**Collaborator:** `musavir@bookleafpub.in`

This repository contains everything needed to complete and submit Assignment 2:

| Deliverable | Location |
| --- | --- |
| Bubble setup (data, pages, privacy, workflows) | `docs/bubble-setup.md`, `docs/bubble-privacy-rules.md`, `docs/bubble-workflows.md` |
| Import CSVs + sample JSON | `data/` |
| n8n workflow export | `n8n/bookleaf-royalty-summary.json` |
| Local webhook mirror (same contract as n8n) | `automation/` |
| AI prompts | `prompts/` |
| Loom script + submission email | `docs/loom-script.md`, `docs/submission-email.md` |

> **Important:** Bubble apps are built in the Bubble editor (no-code). This repo cannot host the live Bubble UI itself. Follow `docs/bubble-setup.md` to assemble the app in ~1–2 days, then wire the webhook URL from n8n or `automation/`.

---

## Architecture

```text
Author / Admin (Bubble)
        │  POST /webhook/royalty-summary
        │  Header: X-API-Key
        ▼
   n8n  (or local automation mirror)
        │── validate API key
        │── idempotency via request_id
        │── author+books payload (default) OR Bubble Data API
        │── OpenAI → royalty summary email
        │── callback → Bubble NotificationLog (Success/Failed)
        └── optional SMTP email (bonus)
```

### Why full payload in the webhook (default)

Bubble already has the author’s books when the admin clicks **Generate**. Sending `author` + `books` + `request_id` keeps the free plan simple (no public Data API), reduces round-trips, and makes the n8n graph easy for reviewers to inspect. The workflow still includes a stub node for Data API fetch if you prefer that later.

---

## Bubble database schema (and why)

| Type | Purpose |
| --- | --- |
| **User** | Auth + `role` (`author`/`admin`) + optional `author_profile` |
| **Author** | Publisher identity (`AUTH00x`), city, rolled-up royalty totals, payout status |
| **Book** | Sales/royalty facts linked to one Author; badge fields for Green/Yellow/Red |
| **NotificationLog** | Audit of every Generate attempt — required for Success/Failed visibility |

Authors and books are separate (relational) so privacy rules and admin filters stay clean. Royalty figures live on **Book** (source of truth from the JSON); Author totals are denormalized for list performance/filters.

### Royalty badge rules

- **Green** — published & `royalty_pending = 0`
- **Yellow** — pending > 0 and last payout within 90 days (or published < 90 days with never paid)
- **Red** — pending > 0 and last payout > 90 days ago, OR never paid & published > 90 days
- **Gray** — still in production

`data/authors.csv` / `data/books.csv` include precomputed badges as of **2026-11-11**.

---

## Quick start — automation mirror (works before Bubble is ready)

```bash
cd automation
cp .env.example .env
# optional: set OPENAI_API_KEY=sk-...
npm install
npm run demo          # prints Priya Sharma royalty email (fallback if no key)
npm start             # webhook on http://127.0.0.1:5678
```

Smoke test:

```bash
curl -s -X POST http://127.0.0.1:5678/webhook/royalty-summary \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: bookleaf-dev-secret' \
  -d '{"author_id":"AUTH001","request_id":"demo-001"}' | python3 -m json.tool
```

Bulk (all authors with pending royalties):

```bash
curl -s -X POST http://127.0.0.1:5678/webhook/royalty-summary/bulk \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: bookleaf-dev-secret' \
  -d '{"request_id_prefix":"bulk-demo"}' | python3 -m json.tool
```

Expose to Bubble with [ngrok](https://ngrok.com): `ngrok http 5678`.

---

## n8n

1. Import `n8n/bookleaf-royalty-summary.json`
2. Configure env vars + OpenAI header auth (see `n8n/README.md`)
3. Activate → copy Production Webhook URL into Bubble API Connector
4. Set `BUBBLE_CALLBACK_URL` to your Bubble Workflow API that updates `NotificationLog`

---

## AI prompt strategy

- System prompt encodes BookLeaf royalty policy (quarterly + 45-day window, ₹1,000 minimum) and Assignment 1 tone rules.
- User prompt sends **only** that author’s facts + computed totals (no unrelated authors).
- Model: `gpt-4o-mini` (cost-efficient). Temperature `0.4` for consistent structure.
- Local mirror falls back to a deterministic template email if `OPENAI_API_KEY` is missing — useful for demos/offline, but use a real model for submission quality.

Files: `prompts/royalty-summary-system.md`, `prompts/royalty-summary-user-template.md`.

---

## Error handling & security

| Concern | Approach |
| --- | --- |
| Webhook security | Shared secret in `X-API-Key`; reject with 401 |
| AI failure | Mark NotificationLog `Failed`, return error, do not silent-fail |
| Bubble unreachable | Log callback error; still return status to caller when possible |
| Bubble UI timeout | Disable button via custom state; on API error set log Failed + alert |
| Idempotency | Unique `request_id` per click; ignore duplicate Success/Pending for 5 min in mirror; Bubble disables button while sending |

---

## 7-day build checklist

| Day | Tasks |
| --- | --- |
| 1 | Bubble account, data types, import CSVs, privacy rules, create Users |
| 2 | Login + author_home (books + badges + totals) |
| 3 | admin_home filters + admin_author detail |
| 4 | NotificationLog + API Connector + Generate workflow |
| 5 | Import n8n (or run automation + ngrok), AI key, callback WF |
| 6 | Bulk trigger, Failed-path test, privacy retest |
| 7 | Loom, README links, invite `musavir@bookleafpub.in`, send submission email |

---

## Test logins (create in Bubble)

See `data/test-accounts.md`.

- Admin: `admin@bookleafpub.in` / `Admin@123`
- Author: `priya.sharma@email.com` / `Author@123`
- Privacy check: `ananya.reddy@email.com` / `Author@123`

---

## Learning notes (Bubble)

If Bubble was new to you, document in your submission:

1. Started with Data types before UI (relational Author → Book).
2. Privacy rules are the real “backend auth” — tested with two author logins.
3. API Connector + Backend Workflow API replaced what would be Express routes in Assignment 1.
4. Free-plan limits (collaborators, speed) → Loom + shared logins as fallback.
5. Kept UI minimal; invested time in webhook security, NotificationLog, and AI prompt fidelity.

---

## Confidentiality

Do not publish this assignment brief publicly. Share repo/Drive links only with BookLeaf reviewers.
