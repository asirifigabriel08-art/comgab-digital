import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';

async function listen(t, options) {
  const server = createServer(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  return `http://127.0.0.1:${server.address().port}`;
}

const requestBody = { messages: [{ role: 'user', content: 'Explain CSS grid.' }] };
const allowedOrigin = 'https://asirifigabriel08-art.github.io';

test('serves the static homepage from the root path', async t => {
  const baseUrl = await listen(t, {});
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /COMGAB DIGITAL/);
});

test('reports a clear setup error if the model key is missing', async t => {
  const baseUrl = await listen(t, {});
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not configured/i);
});

test('rejects disallowed browser origins', async t => {
  const baseUrl = await listen(t, { env: { OPENAI_API_KEY: 'test-secret' } });
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { Origin: 'https://not-our-site.example', 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('validates conversation shape without contacting the provider', async t => {
  let providerCalls = 0;
  const baseUrl = await listen(t, {
    env: { OPENAI_API_KEY: 'test-secret' },
    fetchImpl: async () => { providerCalls += 1; throw new Error('unexpected provider call'); }
  });
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { Origin: allowedOrigin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: 'not allowed' }] })
  });
  assert.equal(response.status, 400);
  assert.equal(providerCalls, 0);
});

test('streams model output and keeps the key server-side', async t => {
  let upstreamRequest;
  const baseUrl = await listen(t, {
    env: { OPENAI_API_KEY: 'test-secret', OPENAI_MODEL: 'test-model' },
    fetchImpl: async (url, options) => {
      upstreamRequest = { url, options, body: JSON.parse(options.body) };
      return new Response(
        'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\ndata: {"choices":[{"delta":{"content":"there."}}]}\n\ndata: [DONE]\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } }
      );
    }
  });
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { Origin: allowedOrigin, 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  const stream = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  assert.match(stream, /Hello /);
  assert.match(stream, /there\./);
  assert.equal(upstreamRequest.options.headers.Authorization, 'Bearer test-secret');
  assert.equal(upstreamRequest.body.model, 'test-model');
  assert.equal(upstreamRequest.body.stream, true);
  assert.equal(upstreamRequest.body.messages.at(-1).content, 'Explain CSS grid.');
  assert.doesNotMatch(stream, /test-secret/);
});

test('rate limits repeated requests from the same client', async t => {
  const baseUrl = await listen(t, {
    env: { OPENAI_API_KEY: 'test-secret' },
    fetchImpl: async () => new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
  });
  const send = () => fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  for (let i = 0; i < 12; i += 1) assert.equal((await send()).status, 200);
  const limited = await send();
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '60');
});
