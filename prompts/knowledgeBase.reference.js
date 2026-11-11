// The BookLeaf knowledge base, condensed to the facts an AI needs to answer
// support queries accurately. Kept as a single trimmed constant so it can be
// injected once per prompt (and cached by the model's prompt-cache if enabled)
// rather than re-derived per request.
//
// Cost note: this block is ~450 tokens. We send it with the DRAFT call (where
// policy accuracy matters) but NOT with the classification call (which only
// needs the category/priority taxonomy, a much smaller prompt).

export const KNOWLEDGE_BASE = `
BOOKLEAF PUBLISHING — SUPPORT KNOWLEDGE BASE

COMPANY
- Self-publishing company operating in India and the US.
- Packages: "Standard Free" (no upfront cost) and "Bestseller Breakthrough" (paid, adds marketing/distribution).
- BookLeaf handles cover design, typesetting, ISBN assignment, printing, distribution, royalty management.
- In-house printing + warehouse in Delhi. Print partners: Repro India, Epitome Books.

ROYALTY POLICY
- 80/20 split: author gets 80% of NET PROFIT per book, BookLeaf keeps 20%.
- Net profit = MRP − printing cost − platform commission (Amazon/Flipkart) − shipping.
- Royalties are calculated QUARTERLY, paid within 45 days of quarter end.
- Minimum payout threshold: ₹1,000. Below that, the balance rolls over to next quarter.
- Payouts go via bank transfer to the account linked in the author's dashboard.

ISBN POLICY
- Every BookLeaf book gets a unique ISBN under BookLeaf's imprint.
- Own-imprint ISBN must be obtained independently by the author.
- ISBN errors (duplicate, wrong book linked) are HIGH priority → escalate to production team, 48h timeline.

PRINTING & QUALITY
- In-house handles most orders; overflow/special formats → Repro India or Epitome Books.
- Standard print turnaround: 5–7 business days from order confirmation.
- Quality issues (misprints, binding defects, color): free reprint after verification; author may share photos.

DISTRIBUTION & AVAILABILITY
- Channels: Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store.
- New listings go live within 7–10 business days after publication completes.
- "Currently Unavailable" usually = stock sync issue; team can trigger a re-sync within 24–48 hours.

PRODUCTION STAGES
- Manuscript Received → Editing (optional) → Cover Design → Typesetting → Proofreading →
  ISBN Assignment → Printing → Distribution Setup → Published & Live.
- Authors are emailed at each stage. Common delays: Cover Design (awaiting author approval), Proofreading (revision rounds).

TONE GUIDELINES (responses MUST follow these)
- Empathetic and professional. Authors are partners, not tickets to close.
- Acknowledge the concern before giving solutions.
- Be specific: use real numbers, dates, statuses — not vague reassurance.
- If it's BookLeaf's fault (late royalty, ISBN error), own it. No corporate deflection.
- For anything needing investigation, give a concrete timeline (e.g. "within 48 hours").
- Always end with a clear next step.
`.trim();

// Canonical category list the model must choose from (keep in sync with Prisma enum).
export const CATEGORIES = [
  'ROYALTY_PAYMENTS',
  'ISBN_METADATA',
  'PRINTING_QUALITY',
  'DISTRIBUTION_AVAILABILITY',
  'BOOK_STATUS_PRODUCTION',
  'GENERAL_INQUIRY',
];

export const CATEGORY_HINTS = `
- ROYALTY_PAYMENTS: payments, payout amounts/timing, royalty calculations, bank details.
- ISBN_METADATA: ISBN errors, wrong/duplicate ISBN, title/author/description metadata.
- PRINTING_QUALITY: misprints, blurry images, binding defects, color issues, damaged copies.
- DISTRIBUTION_AVAILABILITY: "unavailable" on a store, not listed, wrong price on a platform.
- BOOK_STATUS_PRODUCTION: where is my book in production, stuck in typesetting/cover, publish timeline.
- GENERAL_INQUIRY: account questions, bio updates, anything not covered above.
`.trim();

export const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const PRIORITY_HINTS = `
- CRITICAL: money owed for a long time, legal/financial risk, repeated unresolved failure ("no royalty in 6 months").
- HIGH: ISBN errors, quality defects on received copies, book live but unavailable/unsellable.
- MEDIUM: production-status questions, single late update, general royalty-timing questions.
- LOW: cosmetic/optional requests ("update my author bio", "can I change the description").
`.trim();
