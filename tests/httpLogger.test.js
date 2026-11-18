import test, { mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

const lines = [];
mock.module('../utils/logger.js', { defaultExport: { stream: { write: (line) => lines.push(line) } } });
const { httpLogger } = await import('../middleware/logging.js');
const app = express();
app.use(httpLogger);
app.get('/calendar/feed.ics', (req, res) => res.send('ok'));
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));

test('calendar feed tokens and phone numbers are masked in the HTTP log', async () => {
  await (await fetch(`http://127.0.0.1:${server.address().port}/calendar/feed.ics?token=secret-feed-token&phone=0501234567`)).text();
  await new Promise(resolve => setImmediate(resolve));
  const { url } = JSON.parse(lines.at(-1));
  assert.equal(url, '/calendar/feed.ics?token=****&phone=****');
});
