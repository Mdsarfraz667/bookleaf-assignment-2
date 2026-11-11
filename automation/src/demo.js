/**
 * Offline smoke demo: generates a royalty email for AUTH001 without starting the server.
 * Usage: node src/demo.js
 * With AI: OPENAI_API_KEY=sk-... node src/demo.js
 */
import 'dotenv/config';
import { findAuthor, summarizeAuthor } from './dataStore.js';
import { generateRoyaltyEmail } from './ai.js';

const author = findAuthor({ author_id: 'AUTH001' });
const summary = summarizeAuthor(author);
const result = await generateRoyaltyEmail(summary, {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
});

console.log('--- Royalty summary for', author.name, '---');
console.log('model:', result.model, '| fallback:', result.used_fallback);
console.log('');
console.log(result.email_body);
