# Vaelo internal tools — developer brief

## What this is

Two working prototypes built inside Claude (as interactive HTML artifacts) to solve real ops problems at Vaelo Creative:

1. **Ops hub** (`vaelo-ops.html`) — client pipeline, production queue, team tasks, approvals tracker.
2. **Content pipeline** (`vaelo-content.html`) — content calendar workflow tracker for account managers: idea bank → calendar drafted → client approval → creative production → internal approval → client approval → scheduled/posted, with a per-item change log for trend-driven swaps.

Both are functional and in use, but they're **prototypes**, not production infrastructure. This brief is so you can scope what it takes to turn them into something durable.

## Current architecture (important — read before estimating anything)

- **Single HTML file per tool.** Plain JS, no framework, no build step. All markup/CSS/JS in one file.
- **Storage: Claude's artifact `window.storage` API.** This is a key-value store scoped to the Claude.ai artifact itself — it is *not* a real database, has no query capability, no relational structure, and is **only accessible from inside a rendered Claude artifact**. It cannot be reached from a normal website, a script, or any external service. Each tool stores its entire state as one JSON blob under a single key (`shared: true`, meaning anyone who opens that specific artifact link and is logged into Claude can read/write it).
- **No auth, no roles, no permissions.** Anyone with the artifact link has full read/write access to everything. There's no concept of "Jay can edit but not delete" or "only Dhruv can advance stage 4→5."
- **No real integrations.** The "Generate client send" feature in the content pipeline just builds WhatsApp/email text and opens `wa.me` / `mailto:` links — nothing is actually sent programmatically, and nothing writes back to Gmail/WhatsApp history.
- **No connection to the actual Google Sheet.** The content pipeline was seeded once from a manual export of the SimpliCare July sheet. It does not read from or write to Google Sheets — they're two disconnected sources of truth right now.
- **5MB practical ceiling per key**, rate-limited writes, last-write-wins on concurrent edits (no conflict resolution). Fine at current scale, will not scale to many concurrent editors or years of history.

## Data model as it exists today

### Ops hub (`vaelo-ops.html`)
```
clients:    { id, name, stage, contact, retainer }
production: { id, title, client, stage(0-5), due }
tasks:      { id, title, owner, client, done, due }
approvals:  { id, item, client, contact, status, sent }
```
Stored under key `vaelo-ops-state`.

### Content pipeline (`vaelo-content.html`)
```
items: { id, client, month, date, day, format, topic, product, owner,
         stage(0-6), log: [{ d: date, t: text }] }
ideas: { id, client, text, ref, addedBy }
```
Stored under key `vaelo-content-state`.

Stage labels are hardcoded arrays (`STAGES` const) in each file — not configurable without editing code.

## What's genuinely useful to keep

- The workflow modeling is real and tested against Vaelo's actual process (confirmed against a live SimpliCare calendar).
- The stage-gate structure (idea → calendar → client approval → production → internal approval → client approval → posted) and the change-log pattern for trend swaps are the two things worth preserving exactly — they came from mapping the real AM workflow, not a generic template.
- Visual/UX direction can be reused or restyled freely.

## Open questions for scoping (Dhruv hasn't decided these yet — worth a conversation before building)

1. **Hosting model** — standalone web app with real backend + database (Postgres/etc.), vs. staying inside Claude/Google ecosystem somehow. Standalone is almost certainly the right call if this needs auth, roles, or to survive independent of Claude.
2. **Google Sheets** — does the sheet stay the client-facing source of truth (in which case this tool needs to *read/write* Sheets via the Sheets API), or does this tool eventually replace the sheet entirely for internal use while still exporting a clean sheet for clients?
3. **WhatsApp/email sending** — real automation here means WhatsApp Business API (Meta-approved, has cost/approval overhead) and an email API (e.g. Gmail API or SendGrid). Worth confirming this is worth the integration cost vs. keeping the copy-paste-and-send pattern, which already saves the drafting time.
4. **Auth & roles** — at minimum: Dhruv vs. Account Manager vs. Editor permission levels, and a real internal-approval gate (currently just a visual stage with no enforcement).
5. **Multi-client scale** — current data model is fine for ~5-10 clients. Worth asking whether this needs to support Vaelo's growth (more clients, more AMs) from day one or can be iterated.

## Files attached

- `vaelo-ops.html` — ops hub prototype (open directly in a browser to see it run, though storage calls will fail outside Claude's artifact environment)
- `vaelo-content.html` — content pipeline prototype (same caveat)

Both are readable as a straightforward spec of the intended UX/data model even where the storage layer doesn't work standalone.
