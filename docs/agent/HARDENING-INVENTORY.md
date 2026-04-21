# Hardening Inventory

**Session date:** 2026-04-20
**Workspace scope:** Only `Dynasty FF/` was mounted. Other Cowork projects (per memory: Current Projects vs Succesful projects folders) were not accessible from this session. To harden those, re-run the session with the broader `~/Documents/Claude/Projects/` folder selected.

## Work queue (priority desc)

| # | Project | Path | What it does | Claude runtime dep | Tests | Deps pinned | Last change | Priority |
|---|---------|------|--------------|--------------------|-------|-------------|-------------|----------|
| 1 | Dynasty FF | `/Dynasty FF/` | Single-file vanilla JS dashboard for a 12-team Half-PPR Sleeper dynasty league. Served via GitHub Pages. | **None** | None | No (Chart.js 4.4.1 via CDN, no SRI; CORS proxy single-pointed; no lockfile) | 2026-04-10 per SESSION-STATE | **3** |

## Priority reasoning

### Dynasty FF — priority 3 (medium)

**Scoring inputs:**
- Use frequency: weekly during NFL season, rarer off-season (currently off-season, April)
- Current run cost: $0 — no Claude, no server, pure static. Not expensive to run.
- Silent-break surface: **high**. External dependencies (Sleeper API, KTC scraping via CORS proxy, FantasyPros scraping via CORS proxy, unpinned CDN Chart.js, Google Fonts) can each break the site without warning. KTC and FP are scraped, not API'd — schema changes break parsing.

**Why not priority 5:** No Claude costs to cut, no runtime API spend, project is functional today.
**Why not priority 1:** Real silent-break risk from scraped data sources. Without hardening, one CORS proxy outage or KTC markup change and Thomas is reverse-engineering JS by hand.

**Hardening shape for this project:** Rather than the usual "downgrade Opus→Haiku, cache Claude calls" playbook, the value here is in:
1. Pinning external resources with SRI + fallbacks
2. Embedding a snapshot of KTC/FP data so the site degrades gracefully when live scrapes fail
3. Extracting pure logic functions into testable shape + test harness
4. Runbook for diagnosing scrape failures without Claude's help

## Projects not in scope this session
Unknown. Memory says folder hierarchy includes "Current Projects" and "Succesful projects." Only the "Succesful projects/Dynasty FF" subtree was mounted. No inference about other projects is made here.

## Execution plan
One project in queue. Go straight to Phase 2 on Dynasty FF. No cross-project work possible without broader filesystem access.
