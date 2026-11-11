# Royalty Summary — User Prompt Template

n8n / automation fills the placeholders from the author payload.

```text
Write a royalty summary email for this BookLeaf author using ONLY the facts below.

AUTHOR
- Name: {{author.name}}
- Author ID: {{author.author_id}}
- Email: {{author.email}}
- City: {{author.city}}

BOOKS (JSON)
{{books_json}}

COMPUTED TOTALS
- Total royalty earned: ₹{{totals.earned}}
- Total royalty paid: ₹{{totals.paid}}
- Total royalty pending: ₹{{totals.pending}}

NOTES
- Treat status containing "Published" as published.
- Treat any other status as in production.
- last_royalty_payout_date may be null.
```
