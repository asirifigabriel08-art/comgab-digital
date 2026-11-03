# COMGAB Assistant setup

The website is static and can send chat requests directly to a deployed Cloudflare Worker. The browser sends the recent conversation as `{ "messages": [...] }` and expects `{ "reply": "..." }`. Never put API keys or other secrets in browser code.

## Run locally

1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` to a key from your OpenAI account. Never commit `.env` or paste a key into browser code.
2. Set these environment variables in your terminal (or your hosting provider's secret settings):
   - `OPENAI_API_KEY` — required secret.
   - `OPENAI_MODEL` — optional model name; defaults to `gpt-4o-mini`.
   - `PORT` — optional port; defaults to `3000`.
   - `CHAT_ALLOWED_ORIGINS` — comma-separated exact website origins allowed to call the API. Include the production origin and, for local work, `http://localhost:3000` and `http://127.0.0.1:3000`.
3. Run `npm start` and open `http://localhost:3000`. Do not open `index.html` directly or use a static-only preview server: the browser needs the same-origin `/api/chat` endpoint.

## Deploy

For the deployed Cloudflare Worker, `js/chat-config.js` is configured with the Worker's full HTTPS URL. In the Worker CORS settings, allow the exact website origin `https://asirifigabriel08-art.github.io`. The site is hosted under the `/comgab-digital/` path, but the origin does not include that path.

For local development with the included Node.js server, which requires Node.js 20 or later and has no runtime package dependencies, temporarily set `window.COMGAB_CHAT_API_URL` in `js/chat-config.js` to `/api/chat` and run `npm start`. The server requires `OPENAI_API_KEY`; configure it in the server's environment, never in browser code. Set `CHAT_ALLOWED_ORIGINS` to the exact site origin if serving the site from a different host.

## Data and limits

Conversation history is stored only in the visitor's browser local storage (up to 25 recent chats). It is not uploaded until a visitor sends a message; each request contains recent turns for context. Avoid entering sensitive personal information. The API limits messages and applies a basic in-memory per-IP request limit; a production deployment with many server instances should add a shared rate limiter at its hosting edge.

## Portfolio screenshot fallbacks

The portfolio uses the authentic project previews configured in `index.html`. If an external preview becomes unavailable, its card switches to a clear fallback instead of showing a broken image. The Diva Cakes screenshot was captured directly from its live homepage in a browser because automated capture services receive a security-verification page.

| Project | Local screenshot path |
|---|---|
| Dominion Luxury Apartment | `assets/projects/dominion-luxury-apartment.jpg` |
| Bake Birds | `assets/projects/bake-birds.jpg` |
| Greenline Logistics | `assets/projects/greenline-logistics.jpg` |
| COMGAB DIGITAL | `assets/projects/comgab-digital.jpg` |
| Crystal Clear Logic | `assets/projects/crystal-clear-logic.jpg` |
| MO Koncepts Studio | `assets/projects/mo-koncepts-studio.jpg` |
| Diva Cakes | `assets/projects/diva-cakes.jpg` |
| Buttercream Queen | `assets/projects/buttercream-queen.jpg` |
| Aura Home | `assets/projects/aura-home.jpg` |
