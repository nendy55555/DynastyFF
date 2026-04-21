# Til Death do us Part

Dynasty fantasy football league dashboard for a 12-team Half-PPR Sleeper league, running since 2023.

**Live site:** [https://nendy55555.github.io/DynastyFF/](https://nendy55555.github.io/DynastyFF/)

## What's in here

All-time standings, head-to-head records, power rankings, rosters with KTC valuations, draft board grades, trade history with live trade grading, season recaps, analytics charts, contender/rebuilder quadrant chart, and individual team profiles. One self-contained HTML file, no build step.

## Configuration

All tunable values live in the `CONFIG` object at the top of `index.html`:

| Key | What it controls |
|-----|-----------------|
| `CURRENT_SEASON` | The season year used for Sleeper API calls, season filters, chart labels |
| `LEAGUE_START_YEAR` | First season — drives the `SEASONS` getter |
| `TOTAL_TEAMS` | Team count — used in Sleeper league lookup, draft board layout |
| `SLEEPER_USERNAME` | User for Sleeper API discovery |
| `CORS_PROXY` | Proxy URL for KTC/FP fetches (needed for local file:// usage) |
| `PICK_*` | Draft pick valuation tuning (discount rate, top-3 bump, tier boundaries) |
| `TRADE_GRADE.*` | Trade grading algorithm coefficients and letter-grade thresholds |
| `DRAFT_GRADE.*` | Draft board grading multipliers (round penalties, TE adjustments) |

When a new season starts, update `CURRENT_SEASON` and the embedded data objects. Everything else auto-adjusts.

## Data sources

- **Scoring & rosters:** [Sleeper](https://sleeper.com) (fetched live for starter PF data)
- **Player values:** [KeepTradeCut](https://keeptradecut.com) (fetched live via refresh button)
- **Fantasy rankings:** [FantasyPros](https://fantasypros.com) (fetched live)
- **Draft pick values:** KTC pick market, with 10% discount applied

## Stack

- Vanilla HTML/CSS/JS (single file, no build step)
- [Chart.js 4.4.1](https://www.chartjs.org/) for visualizations
- [Inter](https://rsms.me/inter/) typeface
- GitHub Pages for hosting

## Local development

Open `index.html` in a browser. No server required. KTC/FP refresh and Sleeper PF fetch need an internet connection.

## Updating data

Season stats, rosters, and trade history are embedded as JavaScript objects inside `index.html`. To update after a week of games:

1. Pull updated stats from Sleeper
2. Edit `allTimeData`, `rosterData`, `transactionData`, `recordsData`, `streakData`
3. Update `CONFIG.CURRENT_SEASON` if starting a new year
4. Push the updated `index.html` to this repo

## Architecture

The file has three sections:

1. **CSS** (~3800 lines) — Dark theme with CSS custom properties, responsive down to mobile with a bottom nav bar
2. **HTML** (~200 lines) — Tab structure, stat cards, chart canvases, modal overlays
3. **JavaScript** (~3700 lines) — Split into:
   - `CONFIG` block — all tunable constants
   - Data objects — `allTimeData`, `h2hData`, `streakData`, `draftData`, `recordsData`, `transactionData`, `ktcData`, `fpData`, etc.
   - Data validation — IIFE that checks integrity on load
   - Feature modules — standings, H2H, trades, rosters, draft board, analytics, power rankings, team profiles, championship runs, season recaps
   - Mobile nav — bottom bar + "More" sheet

## League settings

12 teams, 1QB, Half-PPR, dynasty format with taxi squads. Full scoring and roster settings are on the League Rules tab of the site.
