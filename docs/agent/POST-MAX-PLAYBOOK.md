# Post-Max Playbook

How to keep this project alive with minimal Claude usage after the Max downgrade.

## The core idea

Everything that used to need Claude, doesn't. The site has zero Claude calls. Maintenance is manual edits, copy-paste commands, and occasional bug triage. Claude is now only useful for: writing new features, debugging weird browser bugs, or refactoring — not daily operations.

## Daily / weekly tasks (no Claude needed)

| Task | How | Time |
|------|-----|------|
| In-season weekly data update | Edit `allTimeData` / `h2hData` in `index.html`, commit, push | 5 min |
| Push any change | `git add -A && git commit -m "..." && git push` from project root | 30 sec |
| Click Refresh Values on the live site | Open site, click button, wait | 30 sec |
| Run tests before pushing | `node tests/extract.mjs && node --test tests/logic.test.mjs` | 2 sec |

All four are documented in `RUNBOOK.md` with exact commands.

## When something breaks (diagnose before paging Claude)

### Step 1 — Check the banner and console

Load the site. Hard refresh. Check:
- Red data-integrity banner at top? → Data mismatch from a recent manual edit. Fix the object that's out of sync.
- Red errors in DevTools console? → Screenshot the first one. Usually points directly at the file + line.
- "Refresh Values" button shows proxy failure? → Wait an hour for rate limits, or swap a CORS proxy in `CONFIG.CORS_PROXY_FALLBACKS`.

### Step 2 — Run tests

If you touched any grading / valuation code:
```bash
cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
node tests/extract.mjs && node --test tests/logic.test.mjs
```

Failing test = the grading logic is wrong. Read the test name, read the function, fix.

### Step 3 — Git bisect if the site regressed

```bash
cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
git log --oneline -10                # find a recent commit that worked
git checkout <good-sha>              # confirm it worked
git checkout main                    # back to latest
git bisect start
git bisect bad
git bisect good <good-sha>
# keep testing until git tells you the bad commit
git bisect reset
```

### Step 4 — Only then ask Claude

With the error, the diff that broke it, and what you already tried. Use the cheapest tier that can handle it (Haiku for yes/no diagnosis, Sonnet for bug fixes).

## What costs Claude tokens (and what doesn't)

### Zero Claude cost
- Everything the site does at runtime
- All tests
- All deploys
- Weekly data updates
- The CORS proxy fallbacks
- localStorage caching
- The data-integrity banner

### Small Claude cost (only when invoked)
- Debugging a new bug you can't figure out from the console
- Writing a new feature
- Updating `pickProjection2026` rollover when the 2026 season ends (you can also do this by hand — see RUNBOOK)

## Seasonal maintenance (once a year, 20 min)

At season end:

1. Bump `CONFIG.CURRENT_SEASON` in `index.html`
2. Rename `pickProjection2026` → `pickProjection2027` (or whatever the new season is) and update `pick` numbers based on standings
3. Add the new season's empty entry in `allTimeData`, `h2hData`, etc.
4. Run tests
5. Commit and push

No Claude needed for any of this if you follow RUNBOOK.md.

## Red flags that warrant re-hardening

If any of these happen, come back and harden again:

- **KTC changes their HTML structure** — scraper breaks silently, falls back to embedded data. Fix the regex in `fetchKTCData`.
- **FantasyPros changes their table markup** — same pattern. Fix the selector in `fetchFPData`.
- **All 3 CORS proxies die** — swap in new ones. Cache still serves last-known values until then.
- **Chart.js releases a breaking change** — don't upgrade unless needed. If you do, update the SRI hash.
- **GitHub Pages changes deploy conventions** — unlikely, but check `https://docs.github.com/pages` before pushing major changes.

## What to do if the site goes completely dark

Worst case: the site returns 404 or serves a white page after a push.

```bash
cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
git log --oneline -5
git revert HEAD           # or: git revert <bad-sha>
git push
```

Time: 2 minutes. Pages rebuilds the last-good version.

## What's intentionally NOT built

- No CI/CD — GitHub Pages auto-deploys, tests run locally
- No dependency manager — no npm, no build step
- No backend — all state is in `index.html` and localStorage
- No Claude API wrapper — zero LLM dependency
- No analytics — privacy-first, no tracking scripts

This simplicity IS the hardening. Every piece of infrastructure you don't have is infrastructure that can't break.
