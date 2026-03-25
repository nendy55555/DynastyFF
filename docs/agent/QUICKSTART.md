# Dynasty FF — Quickstart

> **Read this first, every session.** It is the only file loaded automatically.
> All other context is on-demand — use the routing table below.

---

## What this project is

A self-contained dynasty fantasy football league dashboard for a 12-team Half-PPR Sleeper league (running since 2023). All league history, standings, rosters, trades, power rankings, and analytics live inside a single `index.html` file with no build step.

**Stack:** Vanilla HTML · CSS · JavaScript · Chart.js 4.4.1 (CDN) · Inter typeface (Google Fonts)
**Repo:** `nendy55555/DynastyFF` (GitHub)
**Live URL:** https://nendy55555.github.io/DynastyFF/

---

## Critical rules — apply to every task

- [ ] **Single file.** All code, styles, data, and logic live in `index.html`. No separate JS/CSS files exist or should be created.
- [ ] **No build step.** There is no npm, no bundler, no compilation. Open `index.html` in a browser to test locally.
- [ ] **Data is embedded JS.** All league data is hardcoded as JavaScript objects inside `index.html`. Never guess at field names — read `reference/data-models.md`.
- [ ] **Push = deploy.** Any push to `main` on GitHub automatically goes live via GitHub Pages. There is no staging environment.
- [ ] **No env vars.** There are no server-side secrets or environment variables. The one external call (KTC values) uses a CORS proxy fetched client-side.

---

## Task routing

| I need to... | Read first | Read also if... |
|---|---|---|
| Deploy or push to production | `docs/agent/DEPLOY.md` | Always — deploy = push to main |
| Debug a bug or chart issue | `docs/agent/DEBUG.md` | Known bugs → `AUDIT_REPORT.md` |
| Add or change a feature | `docs/agent/ARCH.md` | Data shape unclear → `reference/data-models.md` |
| Make a product/UX decision | `docs/agent/DECISIONS.md` | Prior decisions → `decisions/adr-log.md` |
| Understand a data object | `reference/data-models.md` | — |
| Understand the external KTC call | `reference/api-schema.md` | — |

---

## Project structure

```
index.html          ← the entire app: HTML, CSS, JS, and all data
docs/
  agent/            ← this documentation set (for Claude)
    QUICKSTART.md
    ARCH.md
    DEBUG.md
    DEPLOY.md
    DECISIONS.md
    QA.md
    SESSION-STATE.md
    reference/
      data-models.md
      api-schema.md
      env-vars.md
      test-cases.md
    decisions/
      adr-log.md
AUDIT_REPORT.md     ← math/logic/chart audit — known bugs documented here
UI-UX-DEEP-REVIEW.md ← UX critique and improvement proposals
README.md
```

---

## Tabs in the app

The app has 13 tabs rendered as a horizontal nav:

| Tab | ID | Description |
|---|---|---|
| Overview | `overview` | League-wide hero stats, Season Scores chart |
| Rosters | `rosters` | Current rosters with KTC valuations |
| Standings | `standings` | All-time or per-season standings table, sortable |
| Season Recaps | `recaps` | Written recaps per season |
| Records | `records` | Scoring records, win/loss streaks |
| Head-to-Head | `h2h` | H2H matrix and drill-down per matchup |
| Playoffs | `playoffs` | Bracket history for 2023, 2024, 2025 |
| Power Rankings | `powerrankings` | Historical power rankings by season |
| Draft Board | `draftboard` | Startup 2023 + rookie draft grades |
| Trades | `transactions` | Full trade history with KTC-graded values |
| Trends | `trends` | 4 analytics charts |
| Analytics | `analytics` | Contender/rebuilder scatter, luck factor |
| Draft Capital | `draftcapital` | Future pick value by team |
| League Rules | `leaguerules` | Scoring settings |

---

## Current state

```
Last updated:     2026-03-25
Last deployment:  production on 2026-03-25 — stable
In-flight work:   none
Known issues:     See DEBUG.md — multiple bugs documented in AUDIT_REPORT.md
Next priority:    Fix critical fake-data bug in Team Profile Scoring Trend chart (Math.random)
```

---

## Debug-first signals

**Where errors surface:**
- Browser console: primary source — open DevTools before reading any code
- No server logs — this is a static file

**Most common failure patterns:**
- Data field mismatch after manual update → check `reference/data-models.md` for exact key names
- Chart not rendering → check browser console for Chart.js errors before reading chart code
- KTC values not loading → CORS proxy failure; check network tab for the fetch request

---

## What not to do

- Do not create separate JS or CSS files — everything stays in `index.html`
- Do not add npm or a build step
- Do not guess at data object field names — they are documented in `reference/data-models.md`
- Do not push directly to `main` without a visual check — it goes live immediately
- Do not read all 7700 lines to orient — use the routing table above
