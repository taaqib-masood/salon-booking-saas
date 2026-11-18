import test from 'node:test';
import assert from 'node:assert/strict';
import { createConversationStore } from '../utils/conversationStore.js';

const sys = () => [{ role: 'system', content: 'sys' }];

test('caps the number of senders and evicts least recently used', () => {
  const store = createConversationStore({ maxEntries: 100 });
  const keep = store.getOrCreate('keep', sys, 0);
  for (let i = 0; i < 10_000; i++) {
    store.getOrCreate(`whatsapp:+${i}`, sys, 1);
    if (i % 50 === 0) store.getOrCreate('keep', sys, 1);
  }
  assert.equal(store.size, 100);
  assert.equal(store.getOrCreate('keep', sys, 1), keep);
});

test('expires idle conversations', () => {
  const store = createConversationStore({ ttlMs: 1000 });
  const first = store.getOrCreate('a', sys, 0);
  first.push({ role: 'user', content: 'hi' });
  store.getOrCreate('b', sys, 5000);
  assert.equal(store.size, 1);
  assert.deepEqual(store.getOrCreate('a', sys, 5000), sys());
});

test('trim bounds history length and drops orphaned tool messages', () => {
  const store = createConversationStore({ maxMessages: 12 });
  const history = store.getOrCreate('a', sys, 0);
  for (let i = 0; i < 500; i++) {
    history.push({ role: 'user', content: 'x'.repeat(1600) });
    history.push({ role: 'assistant', tool_calls: [{ id: `t${i}` }] });
    history.push({ role: 'tool', tool_call_id: `t${i}`, content: '{}' });
    history.push({ role: 'assistant', content: 'ok' });
    store.trim(history);
    assert.ok(history.length <= 13);
    assert.equal(history[0].role, 'system');
    assert.equal(history[1].role, 'user');
  }
});

test('trim keeps only the system prompt when no user turn fits', () => {
  const store = createConversationStore({ maxMessages: 2 });
  const history = [...sys(), { role: 'user', content: 'u' }, { role: 'assistant', tool_calls: [] }, { role: 'tool', content: '{}' }];
  store.trim(history);
  assert.deepEqual(history, sys());
});
