# Copilot instructions

Playful web app that generates food chains for kids based on accepted foods.
Cloudflare Worker with a small script entry point plus static assets.

## Stack
- Cloudflare Workers: `main: worker.js` + `assets.directory: "./public"` in `wrangler.jsonc` (SPA fallback via `not_found_handling`)
- No framework — plain HTML/CSS/JS in `public/`, `worker.js` for any server-side logic
- `npm start` runs a local static preview (`python3 -m http.server`), not the actual Worker

## Deploy
- `package.json` has a `deploy` script (`wrangler deploy`), but there's no GitHub Actions workflow — it's unclear if this runs automatically via Cloudflare's dashboard git integration.
- Don't run `npm run deploy` / `wrangler deploy` yourself. Flag it in the PR instead if a task seems to need a deploy.
- Use relative asset paths.

## Coding rules
- Never hardcode secrets or API keys.
- Keep changes small and scoped to exactly what the task asks for. Don't refactor or touch unrelated files.
- One branch per task, one focused PR.

## Working notes for the agent
- You can't interact with the running app in this workflow — describe what you changed and what should be checked after merge, don't claim to have "tested" it.
- If a task description is ambiguous or too large, say so in the PR description rather than guessing scope.
