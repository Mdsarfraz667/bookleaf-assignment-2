# Submit now — 3 human steps left

Everything else is ready. BookLeaf already said a paid Bubble plan is **not** required.

## Already done
- Live app: https://bookleaf-royalties-22258.bubbleapps.io/version-test
- Admin: `admin@bookleafpub.in` / `Admin@123`
- Author: `priya.sharma@email.com` / `Author@123`
- Privacy author: `ananya.reddy@email.com` / `Author@123`
- Dataset: 10 authors / 18 books
- Webhook + API Connector initialized (keep tunnel alive)
- n8n export + README + share zip: `dist/bookleaf-assignment2-share.zip`
- Collaborator invite blocked on Free → use URL + logins + Loom (allowed)

## You must do (≈10 minutes)

### 1) Loom (required)
1. Open https://www.loom.com/record (or QuickTime + upload)
2. Follow `docs/loom-script.md` (3–5 min)
3. Keep these running while recording Generate & Send:
   ```bash
   cd automation && node src/server.js
   # other terminal — current host is in data/current-tunnel-host.txt
   ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 \
     -R 80:127.0.0.1:5678 nokey@localhost.run
   ```
4. If tunnel host changes: update Bubble API Connector `host` → Initialize

### 2) Share links (required)
Upload **either**:
- `dist/bookleaf-assignment2-share.zip`, **or**
- the whole repo folder

to Google Drive → share **Anyone with the link**, then put that URL in the email.

(Or push to a public GitHub repo if you prefer.)

### 3) Send email on the same thread
Copy `docs/submission-email.md`, paste your Loom URL + Drive/GitHub link, send.

## Do not ask BookLeaf about premium
Their email already covers Free-plan collaborator limits.
