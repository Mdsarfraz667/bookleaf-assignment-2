import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, '../../data/bookleaf_sample_data.json');

const raw = JSON.parse(readFileSync(dataPath, 'utf8'));

const authorsById = new Map(raw.authors.map((a) => [a.author_id, a]));
const authorsByEmail = new Map(raw.authors.map((a) => [a.email.toLowerCase(), a]));

export function findAuthor({ author_id, email }) {
  if (author_id && authorsById.has(author_id)) return authorsById.get(author_id);
  if (email && authorsByEmail.has(String(email).toLowerCase())) {
    return authorsByEmail.get(String(email).toLowerCase());
  }
  return null;
}

export function summarizeAuthor(author) {
  const books = author.books || [];
  const totals = books.reduce(
    (acc, b) => {
      acc.earned += b.total_royalty_earned || 0;
      acc.paid += b.royalty_paid || 0;
      acc.pending += b.royalty_pending || 0;
      acc.sold += b.total_copies_sold || 0;
      return acc;
    },
    { earned: 0, paid: 0, pending: 0, sold: 0 },
  );
  return { author, books, totals };
}

export function allAuthors() {
  return raw.authors;
}
