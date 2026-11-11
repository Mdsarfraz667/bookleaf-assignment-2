import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { findAuthor, summarizeAuthor, allAuthors } from './dataStore.js';
import { generateRoyaltyEmail } from './ai.js';
import { seenRecently, mark } from './idempotency.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.PORT || 5678);
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY || 'bookleaf-dev-secret';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const BUBBLE_CALLBACK_URL = process.env.BUBBLE_CALLBACK_URL || '';
const BUBBLE_API_TOKEN = process.env.BUBBLE_API_TOKEN || '';

const notificationLogs = [];

function requireApiKey(req, res, next) {
  const key = req.header('x-api-key') || req.header('X-API-Key');
  if (!key || key !== WEBHOOK_API_KEY) {
    return res.status(401).json({
      ok: false,
      status: 'Failed',
      error: 'Unauthorized: missing or invalid X-API-Key',
    });
  }
  return next();
}

async function callbackToBubble(payload) {
  if (!BUBBLE_CALLBACK_URL) {
    return { skipped: true, reason: 'BUBBLE_CALLBACK_URL not set' };
  }

  const response = await fetch(BUBBLE_CALLBACK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(BUBBLE_API_TOKEN ? { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`Bubble callback failed (${response.status}): ${text.slice(0, 400)}`);
    error.code = 'bubble_callback_failed';
    throw error;
  }
  return { skipped: false, body: text.slice(0, 400) };
}

async function processAuthorTrigger(body) {
  const request_id = body.request_id || randomUUID();
  const author_id = body.author_id;
  const email = body.email;

  if (seenRecently(request_id)) {
    return {
      ok: true,
      status: 'Success',
      deduped: true,
      request_id,
      message: 'Duplicate request_id within idempotency window; skipped AI regeneration',
    };
  }

  mark(request_id, 'Pending');

  let author = null;
  if (body.author && body.books) {
    author = { ...body.author, books: body.books };
  } else {
    author = findAuthor({ author_id, email });
  }

  if (!author) {
    mark(request_id, 'Failed');
    return {
      ok: false,
      status: 'Failed',
      request_id,
      error: `Author not found for author_id=${author_id || ''} email=${email || ''}`,
    };
  }

  const summary = summarizeAuthor(author);
  const started_at = new Date().toISOString();

  try {
    const ai = await generateRoyaltyEmail(summary, {
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
    });

    const log = {
      request_id,
      author_id: author.author_id,
      author_name: author.name,
      author_email: author.email,
      status: 'Success',
      email_body: ai.email_body,
      model: ai.model,
      used_fallback: ai.used_fallback,
      triggered_at: started_at,
      completed_at: new Date().toISOString(),
      totals: summary.totals,
      error_message: null,
    };

    const callback = await callbackToBubble({
      request_id,
      author_id: author.author_id,
      status: 'Success',
      email_body: ai.email_body,
      triggered_at: started_at,
      completed_at: log.completed_at,
    });

    log.callback = callback;
    notificationLogs.unshift(log);
    mark(request_id, 'Success');

    return { ok: true, ...log };
  } catch (err) {
    const log = {
      request_id,
      author_id: author.author_id,
      author_name: author.name,
      author_email: author.email,
      status: 'Failed',
      email_body: null,
      triggered_at: started_at,
      completed_at: new Date().toISOString(),
      totals: summary.totals,
      error_message: err.message || String(err),
    };

    try {
      await callbackToBubble({
        request_id,
        author_id: author.author_id,
        status: 'Failed',
        error_message: log.error_message,
        triggered_at: started_at,
        completed_at: log.completed_at,
      });
    } catch (callbackErr) {
      log.callback_error = callbackErr.message;
    }

    notificationLogs.unshift(log);
    mark(request_id, 'Failed');
    return { ok: false, ...log };
  }
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'bookleaf-royalty-automation',
    webhook: '/webhook/royalty-summary',
    has_openai: Boolean(OPENAI_API_KEY),
    has_bubble_callback: Boolean(BUBBLE_CALLBACK_URL),
  });
});

app.get('/logs', requireApiKey, (_req, res) => {
  res.json({ ok: true, items: notificationLogs.slice(0, 50) });
});

app.post('/webhook/royalty-summary', requireApiKey, async (req, res) => {
  const result = await processAuthorTrigger(req.body || {});
  res.status(result.ok ? 200 : 500).json(result);
});

app.post('/webhook/royalty-summary/bulk', requireApiKey, async (req, res) => {
  const pendingAuthors = allAuthors().filter((a) =>
    (a.books || []).some((b) => (b.royalty_pending || 0) > 0),
  );

  const results = [];
  for (const author of pendingAuthors) {
    const result = await processAuthorTrigger({
      author_id: author.author_id,
      request_id: req.body?.request_id_prefix
        ? `${req.body.request_id_prefix}-${author.author_id}`
        : randomUUID(),
    });
    results.push(result);
  }

  res.json({
    ok: results.every((r) => r.ok),
    count: results.length,
    results,
  });
});

app.listen(PORT, () => {
  console.log(`BookLeaf royalty automation listening on http://127.0.0.1:${PORT}`);
  console.log(`Webhook: POST /webhook/royalty-summary  (header X-API-Key: ${WEBHOOK_API_KEY})`);
  console.log(`OpenAI: ${OPENAI_API_KEY ? 'enabled' : 'disabled (local fallback email)'}`);
});
