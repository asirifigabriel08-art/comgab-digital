import { createServer as createHttpServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const MAX_BODY_BYTES = 24 * 1024;
const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 10_000;
const MAX_CONTEXT_LENGTH = 20_000;
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

const SYSTEM_PROMPT = `You are COMGAB Assistant, a capable, friendly general-purpose AI assistant embedded in the COMGAB DIGITAL website. Help with general knowledge, writing, research, translation, brainstorming, business, and programming. Explain clearly and adapt detail to the request. Use Markdown when useful. Do not claim to browse the web, run code, or know current facts unless they are supplied in the conversation. Be candid about uncertainty and never invent sources or facts. When asked about COMGAB DIGITAL, you may say it is a Ghana-based web design and digital services brand offering business websites, landing pages, UI/UX, redesigns, SEO essentials, and maintenance. Its contact email is comgabdigital@gmail.com and phone/WhatsApp is +233 54 919 1228. Its listed website package starting prices are GH₵1,500 for landing pages, GH₵2,500 for starter websites, GH₵4,500 for business websites, GH₵7,000 for e-commerce websites, and GH₵300/month for care plans; explain these are starting prices and scope-dependent. Stay professional and do not turn unrelated answers into advertising.`;

function json(res, status, value) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(value));
}

function getAllowedOrigins(env) {
  return new Set(
    (env.CHAT_ALLOWED_ORIGINS || 'https://asirifigabriel08-art.github.io,http://localhost:3000,http://127.0.0.1:3000')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  );
}

function validateMessages(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null;

  const messages = [];
  let totalLength = 0;
  for (const message of value) {
    if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') return null;
    const content = message.content
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) return null;
    totalLength += content.length;
    if (totalLength > MAX_CONTEXT_LENGTH) return null;
    messages.push({ role: message.role, content });
  }

  return messages.at(-1)?.role === 'user' ? messages : null;
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Request body too large'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 });
  }
}

function streamError(res, message) {
  if (!res.destroyed && !res.writableEnded) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
}

async function relayOpenAiStream(upstream, res, signal) {
  if (!upstream.body) throw new Error('Empty model response');

  res.writeHead(200, {
    'Cache-Control': 'no-cache, no-transform',
    'Content-Type': 'text/event-stream; charset=utf-8',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff'
  });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let sawDone = false;
  const consumeLine = line => {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (data === '[DONE]') {
      sawDone = true;
      return;
    }
    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }
    const token = payload.choices?.[0]?.delta?.content;
    if (typeof token === 'string' && token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
    if (payload.choices?.[0]?.finish_reason) sawDone = true;
  };

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || '';
      lines.forEach(consumeLine);
      if (done || sawDone) break;
    }
    if (!signal.aborted && pending) consumeLine(pending);
    if (!signal.aborted) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } finally {
    if (signal.aborted) await reader.cancel().catch(() => {});
  }
}

export function createServer({ env = process.env, fetchImpl = fetch, root = ROOT, now = Date.now } = {}) {
  const allowedOrigins = getAllowedOrigins(env);
  const requestsByIp = new Map();
  const staticRoot = resolve(root);

  return createHttpServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const origin = req.headers.origin;
    const originAllowed = !origin || allowedOrigins.has(origin);

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    if (origin && originAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS' && url.pathname === '/api/chat') {
      if (!originAllowed) return json(res, 403, { error: 'This website is not allowed to use the chat service.' });
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600'
      });
      return res.end();
    }

    if (url.pathname === '/api/chat') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Use POST to send a chat message.' });
      if (!originAllowed) return json(res, 403, { error: 'This website is not allowed to use the chat service.' });
      if (!env.OPENAI_API_KEY) return json(res, 503, { error: 'The AI assistant is not configured yet. Please try again later.' });

      const ip = req.socket.remoteAddress || 'unknown';
      const currentTime = now();
      const windowStart = currentTime - RATE_WINDOW_MS;
      const recentRequests = (requestsByIp.get(ip) || []).filter(time => time > windowStart);
      if (recentRequests.length >= RATE_LIMIT) {
        res.setHeader('Retry-After', '60');
        return json(res, 429, { error: 'Too many messages in a short time. Please wait a minute and try again.' });
      }
      recentRequests.push(currentTime);
      requestsByIp.set(ip, recentRequests);
      if (requestsByIp.size > 2_000) {
        for (const [address, times] of requestsByIp) {
          if (!times.some(time => time > windowStart)) requestsByIp.delete(address);
        }
      }

      let messages;
      try {
        const body = await readJsonBody(req);
        messages = validateMessages(body?.messages);
      } catch (error) {
        return json(res, error.status || 400, { error: error.status === 413 ? error.message : 'Please send a valid chat message.' });
      }
      if (!messages) return json(res, 400, { error: 'Please send a valid chat message.' });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      res.on('close', () => {
        if (!res.writableEnded) controller.abort();
      });

      try {
        const upstream = await fetchImpl(env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
            stream: true,
            max_tokens: 2048
          }),
          signal: controller.signal
        });

        if (!upstream.ok) {
          const status = upstream.status === 429 ? 429 : upstream.status >= 500 ? 503 : 502;
          if (status === 503) console.error(`Model provider returned HTTP ${upstream.status}`);
          return json(res, status, {
            error: status === 429
              ? 'The AI service is busy. Please wait a moment and retry.'
              : 'The AI service could not complete that request. Please try again.'
          });
        }
        await relayOpenAiStream(upstream, res, controller.signal);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Chat provider request failed:', error.message);
          if (res.headersSent) streamError(res, 'The connection was interrupted. Please retry your message.');
          else json(res, 503, { error: 'The AI service is temporarily unavailable. Please try again shortly.' });
        }
      } finally {
        clearTimeout(timeout);
      }
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
    let filePath;
    try {
      const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
      const segments = pathname.split('/').filter(Boolean);
      if (segments.some(segment => segment.startsWith('.')) ||
          ['server.mjs', 'package.json', 'package-lock.json', 'AI-ASSISTANT-SETUP.md', 'tests'].includes(segments[0])) {
        return json(res, 404, { error: 'Not found.' });
      }
      filePath = resolve(staticRoot, `.${pathname}`);
    } catch {
      return json(res, 400, { error: 'Invalid path.' });
    }
    if (filePath !== staticRoot && !filePath.startsWith(staticRoot + sep)) return json(res, 403, { error: 'Forbidden.' });
    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) return json(res, 404, { error: 'Not found.' });
      const content = await readFile(filePath);
      res.writeHead(200, {
        'Cache-Control': extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=3600',
        'Content-Length': content.length,
        'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream'
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      json(res, 404, { error: 'Not found.' });
    }
  });
}

async function loadLocalEnvironment() {
  let contents;
  try {
    contents = await readFile(resolve(ROOT, '.env'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    process.env[match[1]] = value;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await loadLocalEnvironment();
  const server = createServer();
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, () => {
    console.log(`COMGAB DIGITAL listening on port ${port}`);
    if (!process.env.OPENAI_API_KEY) console.warn('OPENAI_API_KEY is missing; /api/chat will return a setup error.');
  });
}
