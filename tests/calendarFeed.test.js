import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

const injected = 'Mallory\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:Call +1-555; win, now\\';
mock.module('../lib/supabase.js', { namedExports: { supabase: {
  from() {
    const chain = {
      select() { return chain; }, eq() { return chain; }, in() { return chain; },
      gte() { return chain; }, lte() { return chain; }, order() { return chain; },
      then(resolve, reject) {
        return Promise.resolve({ data: [
          { id: 'a1', date: '2030-01-01', time_slot: '10:00', end_time: '11:00', status: 'confirmed',
            customers: { name: injected, phone: '050\n123' }, staff: { name: 'Sara' }, services: { name_en: 'Cut, Blow-dry ' + 'x'.repeat(80), duration: 60 } },
          { id: 'a2', date: '2030-01-02', time_slot: '12:00', end_time: '13:00', status: 'pending',
            customers: { name: 'Bob' }, staff: { name: 'Sara' }, services: { name_en: 'Color', duration: 60 } },
        ] }).then(resolve, reject);
      },
    };
    return chain;
  },
} } });

const { default: calendarRouter, escapeICalText, foldICalLine } = await import('../routes/calendar.js');
const app = express();
app.use('/cal', calendarRouter);
const server = app.listen(0);
after(() => server.close());

test('escapeICalText escapes RFC 5545 TEXT specials', () => {
  assert.equal(escapeICalText('a\\b;c,d\r\ne\nf\rg\u0007'), 'a\\\\b\\;c\\,d\\ne\\nf\\ng');
});

test('foldICalLine keeps lines within 75 octets and unfolds losslessly', () => {
  const line = 'SUMMARY:' + 'é'.repeat(100);
  const folded = foldICalLine(line);
  for (const l of folded.split('\r\n')) assert.ok(Buffer.byteLength(l) <= 75);
  assert.equal(folded.replace(/\r\n /g, ''), line);
});

test('injected customer name cannot add calendar components or properties', async () => {
  const res = await fetch(`http://127.0.0.1:${server.address().port}/cal/feed.ics?tenant_id=t1`);
  const body = await res.text();
  const lines = body.split('\r\n');
  assert.equal(lines.filter((l) => l === 'BEGIN:VEVENT').length, 2);
  assert.equal(lines.filter((l) => l === 'END:VEVENT').length, 2);
  assert.equal(lines.filter((l) => l.startsWith('SUMMARY:')).length, 2);
  for (const l of lines) assert.ok(Buffer.byteLength(l) <= 75);
  const unfolded = body.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('Mallory\\nEND:VEVENT\\nBEGIN:VEVENT\\nSUMMARY:Call +1-555\\; win\\, now\\\\'));
  assert.ok(unfolded.includes('Phone: 050\\n123'));
  assert.ok(unfolded.includes('Cut\\, Blow-dry'));
});
