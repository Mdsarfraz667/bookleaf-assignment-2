# Remaining steps that need you (cannot be automated)

The assignment requires a **real Bubble.io app** and a **live n8n connection**. Those need your accounts.

## 1. Sign in to Bubble (blocked right now)

1. Open the Cursor browser tab (or https://bubble.io/login).
2. Complete Google sign-in / create a Bubble account.
3. Reply here: **“Bubble logged in”**.
4. I will then build data types, pages, privacy, and workflows in the editor with you.

Without this login, Part A (25% of the score) cannot be finished by an agent alone.

## 2. OpenAI API key (recommended)

```bash
# in automation/.env
OPENAI_API_KEY=sk-...
```

Without a key, the automation mirror still returns a policy-correct **fallback** email (good for demos). For submission quality, use a real model.

## 3. n8n (local is starting)

```bash
cd /Users/abdulrehman/bookleaf
npm run n8n
# open http://127.0.0.1:5679
# Import: n8n/bookleaf-royalty-summary.json
```

Or keep using the automation mirror (same webhook contract):

```bash
npm run automation
# POST http://127.0.0.1:5678/webhook/royalty-summary
```

Bubble (cloud) cannot call `127.0.0.1`. After Bubble exists, expose with:

```bash
npx localtunnel --port 5678
# or ngrok http 5678
```

Put that public URL into Bubble’s API Connector.

## 4. GitHub / Drive share

`gh` is not logged in on this machine. Either:

```bash
gh auth login
gh repo create bookleaf-assignment-2 --private --source=. --push
```

or zip the folder and upload to Google Drive (“Anyone with the link”).

## 5. Loom + collaborator

- Invite `musavir@bookleafpub.in` in Bubble (or share live URL + logins + Loom).
- Record 3–5 min using `docs/loom-script.md`.
- Send `docs/submission-email.md` on the same email thread.

## Already running locally

| Service | URL |
| --- | --- |
| Automation webhook | http://127.0.0.1:5678/webhook/royalty-summary |
| Health | http://127.0.0.1:5678/health |
| n8n (when ready) | http://127.0.0.1:5679 |
