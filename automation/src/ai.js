import { ROYALTY_SYSTEM_PROMPT } from './knowledgeBase.js';

function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function fallbackEmail({ author, books, totals }) {
  const published = books.filter((b) => String(b.status || '').includes('Published'));
  const production = books.filter((b) => !String(b.status || '').includes('Published'));

  const bookBlocks = published
    .map((b) => {
      const last = b.last_royalty_payout_date || 'no payout yet';
      return [
        `• "${b.title}"`,
        `  Copies sold: ${b.total_copies_sold || 0}`,
        `  Earned: ${inr(b.total_royalty_earned)} | Paid: ${inr(b.royalty_paid)} | Pending: ${inr(b.royalty_pending)}`,
        `  Last payout: ${last}`,
      ].join('\n');
    })
    .join('\n\n');

  const productionBlock = production.length
    ? `\n\nProduction updates:\n${production
        .map((b) => `• "${b.title}" — currently at ${b.status}.`)
        .join('\n')}`
    : '';

  let pendingNote = '';
  if (totals.pending > 0) {
    pendingNote =
      totals.pending < 1000
        ? `\n\nYour pending balance of ${inr(totals.pending)} is below the ₹1,000 minimum payout threshold, so it will roll over to the next quarterly cycle. Once it crosses ₹1,000, we pay within 45 days of quarter end via bank transfer.`
        : `\n\nYou currently have ${inr(totals.pending)} pending. Royalties are calculated quarterly and paid within 45 days of quarter end to your linked bank account. Our team is reviewing this balance in the current cycle.`;
  } else if (published.length) {
    pendingNote =
      '\n\nGreat news — your published titles are fully paid up for the amounts recorded so far. Thank you for publishing with BookLeaf.';
  }

  return [
    `Dear ${author.name},`,
    '',
    'I hope you are doing well. Here is your latest BookLeaf royalty summary.',
    '',
    'Published books:',
    bookBlocks || '• No published books yet.',
    '',
    `Totals across your catalog:`,
    `• Total earned: ${inr(totals.earned)}`,
    `• Total paid: ${inr(totals.paid)}`,
    `• Total pending: ${inr(totals.pending)}`,
    pendingNote.trimStart(),
    productionBlock,
    '',
    'If anything looks off, reply to this email and we will review your ledger within 2 business days.',
    '',
    'Warm regards,',
    '— The BookLeaf Team',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function generateRoyaltyEmail(summary, { apiKey, model } = {}) {
  const userPrompt = [
    'Write a royalty summary email for this BookLeaf author using ONLY the facts below.',
    '',
    'AUTHOR',
    `- Name: ${summary.author.name}`,
    `- Author ID: ${summary.author.author_id}`,
    `- Email: ${summary.author.email}`,
    `- City: ${summary.author.city}`,
    '',
    'BOOKS (JSON)',
    JSON.stringify(summary.books, null, 2),
    '',
    'COMPUTED TOTALS',
    `- Total royalty earned: ${inr(summary.totals.earned)}`,
    `- Total royalty paid: ${inr(summary.totals.paid)}`,
    `- Total royalty pending: ${inr(summary.totals.pending)}`,
  ].join('\n');

  if (!apiKey) {
    return {
      email_body: fallbackEmail(summary),
      model: 'local-fallback',
      used_fallback: true,
    };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: ROYALTY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    const error = new Error(`AI API failed (${response.status}): ${errText.slice(0, 500)}`);
    error.code = 'ai_failed';
    throw error;
  }

  const json = await response.json();
  const email_body = json.choices?.[0]?.message?.content?.trim();
  if (!email_body) {
    const error = new Error('AI API returned empty content');
    error.code = 'ai_failed';
    throw error;
  }

  return {
    email_body,
    model: model || 'gpt-4o-mini',
    used_fallback: false,
  };
}
