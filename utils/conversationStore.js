// Bounded per-sender chat history: LRU by last access, idle TTL, capped length.
export function createConversationStore({ maxEntries = 1000, ttlMs = 30 * 60 * 1000, maxMessages = 12 } = {}) {
  const entries = new Map(); // insertion order == least recently used first

  function evict(now) {
    for (const [key, entry] of entries) {
      if (entries.size <= maxEntries && now - entry.at <= ttlMs) break;
      entries.delete(key);
    }
  }

  return {
    get size() { return entries.size; },

    getOrCreate(key, init, now = Date.now()) {
      let entry = entries.get(key);
      entries.delete(key);
      if (!entry || now - entry.at > ttlMs) entry = { history: init() };
      entry.at = now;
      entries.set(key, entry);
      evict(now);
      return entry.history;
    },

    // Keep the system prompt plus the last maxMessages, starting at a user turn
    // so no orphaned tool results remain.
    trim(history) {
      const tail = history.slice(1).slice(-maxMessages);
      const start = tail.findIndex((m) => m.role === 'user');
      history.splice(1, history.length - 1, ...(start < 0 ? [] : tail.slice(start)));
    },
  };
}
