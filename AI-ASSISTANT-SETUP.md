# COMGAB Assistant setup

The website is static, so the chat model runs through the included Node.js server. The browser never receives the model API key. The server requires Node.js 20 or later and uses the built-in `fetch` API; it has no runtime package dependencies.

## Run locally

1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` to a key from your OpenAI account. Never commit `.env` or paste a key into browser code.
2. Set these environment variables in your terminal (or your hosting provider's secret settings):
   - `OPENAI_API_KEY` — required secret.
   - `OPENAI_MODEL` — optional model name; defaults to `gpt-4o-mini`.
   - `PORT` — optional port; defaults to `3000`.
   - `CHAT_ALLOWED_ORIGINS` — comma-separated exact website origins allowed to call the API. Include the production origin and, for local work, `http://localhost:3000` and `http://127.0.0.1:3000`.
3. Run `npm start` and open `http://localhost:3000`. Do not open `index.html` directly or use a static-only preview server: the browser needs the same-origin `/api/chat` endpoint.

## Deploy

Deploy this repository to a Node.js host that supports Node 20+ (for example, Render as a Node web service). Set the start command to `npm start` and configure `OPENAI_API_KEY`, `OPENAI_MODEL` (optional), and `CHAT_ALLOWED_ORIGINS` in the host's environment/secret settings. Set the allowed origin to the exact public site origin, such as `https://asirifigabriel08-art.github.io`. The service serves the existing static site and the `/api/chat` streaming endpoint from the same origin.

If you keep the site on GitHub Pages, deploy the Node server separately and set `window.COMGAB_CHAT_API_URL` in `js/chat-config.js` to the server's full HTTPS endpoint, such as `https://your-service.example/api/chat`. Set `CHAT_ALLOWED_ORIGINS` on the API host to the exact GitHub Pages origin. Do not add a trailing slash to the endpoint.

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
