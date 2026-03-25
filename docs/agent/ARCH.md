# Architecture

> Read this before adding a feature, modifying a section, or changing how data flows.

---

## System overview

The entire app is one HTML file (~7700 lines as of March 2026). The browser loads `index.html` from GitHub Pages, renders the UI, and runs all logic client-side. There is no server, no database, and no build step. All league data is embedded as JavaScript object literals inside `<script>` tags. The only network call happens when the user clicks "Refresh KTC Values," which hits a CORS proxy to fetch live player values from KeepTradeCut.

```
GitHub Pages (static host)
  └── index.html
        ├── <style>       — all CSS (~3000 lines)
        ├── <body>        — all HTML markup, tab panels, chart canvases
        └── <script>      — all data objects + all JS logic (~4000 lines)
              ├── Data layer   — JS object literals (allTimeData, h2hData, etc.)
              ├── Render layer — functions that build DOM from data
              └── Event layer  — click handlers, tab switching, sort logic
```

---

## Code organization within index.html

The file is structured top to bottom:

| Lines (approx) | Content |
|---|---|
| 1–3080 | CSS (variables, components, responsive styles) |
| 3080–3870 | HTML markup (header, nav, tab panels, canvas elements) |
| 3870–4420 | Core data objects (`allTimeData`, `h2hData`, `streakData`, `draftData`, `recordsData`, `colors`) |
| 4420–5480 | `transactionData` — full trade history |
| 5480–6100 | `powerRankingsData`, `ktcPickValues`, `draftCapitalData` |
| 6100–7700 | All JS logic — rendering functions, event handlers, chart initializations |

---

## Data layer

All data is hardcoded as JS object literals. No fetch calls populate these (except KTC values, which overlay onto static roster data).

**Primary objects:**

| Object | Purpose |
|---|---|
| `allTimeData` | Per-owner record: wins, losses, fpts, ppts, fpts_against, per-season breakdown. Keyed by `ownerKey` (e.g. `"nendy"`, `"jakeschwartz"`) |
| `h2hData` | Head-to-head records between every pair of owners. `h2hData[ownerA][ownerB]` = `{ wins, losses, games }` |
| `streakData` | Longest win/loss streak per owner. Keyed by `ownerKey` |
| `draftData` | Draft pick grades per draft (startup2023, rookie2024, rookie2025). Contains player picks and letter grades |
| `recordsData` | Single-season and single-game scoring records |
| `transactionData` | All trades, keyed by date. Each trade has `teams` array and `assets` per team |
| `powerRankingsData` | Preseason rank and actual finish per season per owner |
| `ktcPickValues` | KTC market values for draft picks, by tier and year (fetched live and cached in-memory) |
| `draftCapitalData` | Each owner's current future pick holdings |
| `colors` | Owner-to-color mapping for charts |

For field-level detail on each object: `reference/data-models.md`

---

## Render layer

Each tab has one or more render functions that build DOM elements from the data objects above. The pattern is consistent:

1. Read from a data object
2. Build HTML strings or DOM nodes
3. Set `innerHTML` or `appendChild` on a container element with a known ID

**Key render functions:**

| Function | Tab | What it does |
|---|---|---|
| `populateStandings(sortKey, sortDir)` | Standings | Builds table rows from `allTimeData`, applies sort and season filter |
| `renderH2HGrid()` | H2H | Builds the full matrix grid from `h2hData` |
| `renderTransactions(filter)` | Trades | Filters and renders trade cards from `transactionData` |
| `renderRecords()` | Records | Reads `recordsData` and `streakData` |
| `renderBracket(year)` | Playoffs | Builds bracket HTML for the given season |
| `renderPowerRankings(year)` | Power Rankings | Reads `powerRankingsData` |
| `renderDraftBoard(draftKey)` | Draft Board | Reads `draftData` |
| `openTeamProfile(owner)` | (modal) | Opens team detail modal, reads `allTimeData` and `transactionData` |
| Chart initializations | Trends / Analytics | Chart.js instances, created on tab activation |

---

## Event layer

- **Tab switching:** `.nav-tab` click listeners call `switchToTab(tabName)`, which shows/hides `.tab-content` panels and re-renders chart canvases as needed
- **Sort:** Standings table headers call `populateStandings(col, dir)` with updated sort state
- **Season filter:** Standings season buttons update `currentStandingsSeason` then re-call `populateStandings`
- **KTC refresh:** Button triggers a fetch to CORS proxy → overlays values onto roster display
- **URL hash routing:** On load, `window.location.hash` is checked to deep-link to a tab or team profile

---

## Adding a new tab or section

Before writing code, confirm:
- [ ] Add a `<button class="nav-tab" data-tab="[id]">` inside a `.nav-group-tabs` in the nav
- [ ] Add a `<div id="[id]" class="tab-content">` in the body, after existing tab panels
- [ ] Add a render function that reads from an existing data object or a new one
- [ ] If adding a new data object, document it in `reference/data-models.md`
- [ ] If adding a Chart.js chart, initialize it inside the tab-activation event (not on page load — canvas must be visible)

---

## Adding data for a new season

1. Update `allTimeData` — add the season key under each owner
2. Update `h2hData` — add all new matchup results
3. Update `streakData` — recalculate longest streaks
4. Update `transactionData` — add trades from the season
5. Update `powerRankingsData` — add preseason rank and final finish
6. Add a new playoff bracket data block and render call
7. Add a season recap block in the `recaps` tab

---

## What not to do architecturally

- No separate JS or CSS files — everything stays in `index.html`
- No npm packages or build step
- No server-side logic of any kind
- No storing user state beyond the current browser session
- Do not duplicate data across objects — pick the canonical source and reference it
