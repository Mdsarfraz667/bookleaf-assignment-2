# Live Bubble setup status

App: **BookLeaf Royalties**  
Editor: https://bubble.io/page?id=bookleaf-royalties-22258  
Preview: https://bookleaf-royalties-22258.bubbleapps.io/version-test

## Done
- Sample data: **10 Authors** (`AUTH001`–`AUTH010`), **18 Books** (`BK001`–`BK018`)
- Privacy rules reviewed (author isolation via Author user field)
- Automation webhook on `:5678` + public tunnel via **localtunnel**
  - Current host: `c69f7d793e4423.lhr.life` (also in `data/current-tunnel-host.txt`)
  - `POST https://c69f7d793e4423.lhr.life/webhook/royalty-summary`
  - Header: `X-API-Key: bookleaf-dev-secret` (+ `Bypass-Tunnel-Reminder: true`)
- Bubble API Connector **Send royalty summary** **INITIALIZED** (~1.6s, `ok: true`) on current host
- Temporary **Sign up** + **Log out** on the live app
- Passworded Users:
  - `admin@bookleafpub.in` / `Admin@123`
  - `priya.sharma@email.com` / `Author@123` → AUTH001
  - `ananya.reddy@email.com` / `Author@123` → AUTH003
- BK001/BK002/BK005 Author user set
- **E2E Generate & Send** for Priya: NotificationLog **Success** (prior run)
- Automation **idempotency**: duplicate `request_id` within **60s** → `deduped: true`
- AI email uses **local-fallback** when `OPENAI_API_KEY` is empty

## Blocked / needs human
1. **Collaborator invite** `musavir@bookleafpub.in` — Free plan: *“does not allow collaboration”*. Share Preview URL + logins + Loom, or upgrade to Growth.
2. **Bubble AI Agent = 0 credits** — cannot auto-finish colored Green/Yellow/Red badges, payout filter labels (`Fully paid` / `Pending` / `Overdue` / `In production`), Bubble-side 60s Pending gate, or store `email_body` on Success. Agent plan is drafted; needs credits or manual Design/Workflow edits.
3. **Loom** — record with `docs/loom-script.md`, paste URL into `docs/submission-email.md`.
4. Optional: set `OPENAI_API_KEY` in `automation/.env` and restart the Node server.

## Keep services alive
```bash
# terminal 1 — automation
cd automation && node src/server.js

# terminal 2 — public tunnel
npx localtunnel --port 5678
# then update Bubble API Connector host + Initialize if URL changes
```

## n8n (optional parallel path)
http://127.0.0.1:5679 — `admin@bookleafpub.in` / `BookLeaf@n8n123`  
Export: `n8n/bookleaf-royalty-summary.json`
