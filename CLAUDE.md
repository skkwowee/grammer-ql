# Raindrop CFG — Natural Language to ClickHouse SQL

## Tech Stack
- **Next.js 15** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Tinybird** (free tier) for ClickHouse-compatible SQL execution
- **OpenAI GPT-5** with Context Free Grammar (Lark syntax via custom tool type)

## Architecture
1. User types a natural language query in the frontend
2. `POST /api/query` sends the query to GPT-5 with a Lark CFG grammar as a custom tool
3. GPT-5 returns syntactically valid ClickHouse SQL (guaranteed by the grammar)
4. The SQL is executed against Tinybird's SQL API
5. Results are returned and displayed in a table

## Running
```bash
# First time setup
./init.sh
# Or manually:
npm install
cp .env.example .env.local  # then fill in API keys
npm run dev
```

Dev server runs at http://localhost:3000

## Environment Variables
- `OPENAI_API_KEY` — OpenAI API key (GPT-5 access required)
- `TINYBIRD_TOKEN` — Tinybird auth token
- `TINYBIRD_HOST` — Tinybird API host (e.g. `https://api.us-east.tinybird.co`)

## Running Evals
```bash
npx tsx src/evals/run-evals.ts
```

## Project Structure
- `src/app/page.tsx` — Main UI (query input + results table)
- `src/app/api/query/route.ts` — API route: NL → SQL → execute → return
- `src/lib/grammar.ts` — Lark CFG grammar definition
- `src/lib/openai.ts` — GPT-5 CFG call wrapper
- `src/lib/tinybird.ts` — Tinybird SQL API client
- `src/evals/` — 3 eval suites + runner
- `features.json` — Feature tracking (update `passes` as features are completed)
- `claude-progress.txt` — Session progress log

## Conventions
- TypeScript strict mode
- Server components by default; `"use client"` only when needed
- Keep files small and focused
- No unnecessary abstractions — this is a take-home, not a production app
- Error messages should be user-friendly in the UI, detailed in the console
