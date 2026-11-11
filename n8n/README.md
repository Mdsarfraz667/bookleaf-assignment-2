# n8n — BookLeaf Royalty Summary

## Import

1. Open n8n Cloud or local n8n (`npx n8n` / Docker).
2. **Workflows → Import from File** → select `bookleaf-royalty-summary.json`.
3. Set environment / variables:
   - `BOOKLEAF_WEBHOOK_API_KEY` = shared secret (same value Bubble sends as `X-API-Key`)
   - `BUBBLE_CALLBACK_URL` = Bubble Backend Workflow URL that updates `NotificationLog`
   - `BUBBLE_API_TOKEN` = Bubble API token (if required by your callback workflow)
4. Create **Header Auth** credential for OpenAI:
   - Name: `Authorization`
   - Value: `Bearer sk-...`
5. Activate the workflow. Copy the Production Webhook URL.

Production webhook path: `POST /webhook/royalty-summary`

## Recommended Bubble → n8n contract

```http
POST https://<n8n-host>/webhook/royalty-summary
X-API-Key: <shared-secret>
Content-Type: application/json
```

```json
{
  "request_id": "uuid-or-bubble-unique-id",
  "notification_log_id": "bubble-thing-unique-id",
  "author_id": "AUTH001",
  "author": {
    "author_id": "AUTH001",
    "name": "Priya Sharma",
    "email": "priya.sharma@email.com",
    "city": "Mumbai"
  },
  "books": [
    {
      "book_id": "BK001",
      "title": "Whispers of the Ganges",
      "status": "Published & Live",
      "total_copies_sold": 342,
      "total_royalty_earned": 11970,
      "royalty_paid": 8400,
      "royalty_pending": 3570,
      "last_royalty_payout_date": "2025-10-15"
    }
  ]
}
```

### Why full payload (chosen default)

| Option | Choice |
| --- | --- |
| Full author+books in webhook | **Selected** — works on Bubble free plan without exposing Data API; Bubble already has the data when admin clicks; fewer moving parts for reviewers |
| n8n fetches Bubble Data API | Optional upgrade — replace node `Fetch From Bubble (configure)` with HTTP Request constraints on `author` / `book` |

## Local mirror (no n8n required for your own testing)

See `../automation/` — same webhook contract, idempotency, AI/fallback email, Bubble callback.

```bash
cd automation
cp .env.example .env
npm install
npm start
# POST http://127.0.0.1:5678/webhook/royalty-summary
```

Expose with ngrok when Bubble must call it:

```bash
ngrok http 5678
```

## Error handling

- Invalid/missing `X-API-Key` → `401` + Failed
- Missing author payload → callback Failed + `500`
- OpenAI failure (`continueOnFail`) → Parse AI Result marks Failed → Bubble callback Failed
- Bubble callback failure does not swallow the AI result; response still returns status for Bubble UI

## Idempotency

Bubble should create `NotificationLog` with unique `request_id` before calling the webhook and disable the button for ~30s.  
The local automation mirror also de-dupes identical `request_id` for 5 minutes. In n8n Cloud you can add a Data Store node keyed by `request_id` if desired.
