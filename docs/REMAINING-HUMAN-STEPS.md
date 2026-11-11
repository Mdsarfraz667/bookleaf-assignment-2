# Remaining steps

## Done
- Live app: https://bookleaf-royalties-22258.bubbleapps.io/version-test
- 10 Authors + 18 Books; users + Author links
- Tunnel: `https://c69f7d793e4423.lhr.life/webhook/royalty-summary` (`data/current-tunnel-host.txt`)
- API Connector **INITIALIZED** on that host
- E2E Success log for Priya; automation 60s `request_id` idempotency

## You still need to do
1. Keep `node src/server.js` + `npx localtunnel --port 5678` running during review; if the loca.lt URL changes, update API Connector host → Initialize.
2. Collaboration invite for `musavir@bookleafpub.in` is **blocked on Free** — share URL + logins, or upgrade Growth then Invite.
3. Record Loom (`docs/loom-script.md`) and send `docs/submission-email.md`.
4. Optional OpenAI key in `automation/.env`.
5. Optional Bubble AI credits: finish badges / payout filter labels / Bubble Pending 60s / store `email_body`.
