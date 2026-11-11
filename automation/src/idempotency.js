const recent = new Map();
const TTL_MS = 60 * 1000; // match Bubble Pending window

export function seenRecently(requestId) {
  if (!requestId) return false;
  prune();
  const hit = recent.get(requestId);
  if (!hit) return false;
  return hit.status === 'Success' || hit.status === 'Pending';
}

export function mark(requestId, status) {
  if (!requestId) return;
  recent.set(requestId, { status, at: Date.now() });
}

function prune() {
  const now = Date.now();
  for (const [key, value] of recent.entries()) {
    if (now - value.at > TTL_MS) recent.delete(key);
  }
}
