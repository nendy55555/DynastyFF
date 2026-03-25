# Product and design decisions

> Read this before making any choice that affects UX, product direction, or technical approach.
> For the full decision history: `decisions/adr-log.md`

---

## Active constraints

| Area | Decision | Why | Since |
|---|---|---|---|
| Architecture | Single HTML file — no build step, no separate JS/CSS files | No deployment complexity; any editor can open and run it; no toolchain to maintain | 2023 (founding) |
| Styling | Vanilla CSS with custom properties — no Tailwind, no CSS-in-JS | No toolchain; custom properties (--bg-primary, etc.) cover all theming needs | 2023 |
| Charts | Chart.js 4.4.1 via CDN — no other chart libraries | Already integrated; covers all current chart types; CDN avoids npm | 2023 |
| Hosting | GitHub Pages — no Vercel, no Netlify | Free, automatic, tied to the git repo; zero config | 2023 |
| Data | All data embedded as JS objects in index.html — no external database or JSON files | No backend; works offline; no API keys; easy to update by editing the file | 2023 |
| KTC values | Client-side CORS proxy fetch on demand — not embedded | KTC values change daily; embedding would require daily manual updates | 2023 |
| Draft pick discount | 10% discount applied to KTC pick values | Picks tend to be overvalued vs players in actual trades | 2023 |

---

## Product rules

- The site is read-only — no user accounts, no input forms, no user-generated data
- All data comes from Sleeper (stats/rosters) or KTC (player/pick values) — no manual stat fabrication
- Charts must use real data — the Math.random() scoring trend is a known violation that needs to be fixed
- Mobile layout is supported — responsive breakpoints exist throughout the CSS

---

## UX conventions

| Element | Convention |
|---|---|
| Color theme | Dark background (`#0f1117`) with teal accent (`#00d4aa`) and gold accent (`#ffd700`) |
| Owner keys | Snake-case lowercase username from Sleeper (e.g. `nendy`, `jakeschwartz`, `DeezNutz02`) — these are the canonical identifiers across all data objects |
| Tab navigation | Grouped into three nav groups: Core / History / Analysis |
| Tables | Sortable by column header click; default sort is Win % descending |
| Charts | Chart.js only; initialize inside the tab-activation handler, not on page load |
| Trophies | Championship rings displayed on overview using emoji/icon with click-through to season recap |

---

## Open questions

- **Standings tiebreaker:** Tied teams sort by JS object insertion order. Tiebreaker cascade (Win% → PF → H2H) is proposed but not implemented.
- **Scoring trend chart:** Real weekly scores are not currently embedded. Decision needed: embed weekly score history or remove the chart.
- **Luck formula:** Current Max-PF-rank-based formula systematically penalizes the best teams. Schedule-adjusted model proposed in AUDIT_REPORT.md — not yet implemented.
- **2025 playoff bracket:** Data may need updating once the 2025 season concludes.

---

## How to make a new decision

1. State the problem and options considered
2. Choose and document why
3. Add a row to Active constraints above
4. Add a full ADR to `decisions/adr-log.md`
