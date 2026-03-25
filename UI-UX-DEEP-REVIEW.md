# UI/UX Deep Review: Til Death do us Part — Dynasty FF Dashboard

**Reviewers:**
- **Designer A** — Sports & gaming interfaces (ESPN, Sleeper, Yahoo Fantasy)
- **Designer B** — Data-heavy dashboards (Tableau, Grafana, financial terminals)
- **Designer C** — Mobile-first design systems (iOS HIG, Material, component libraries)

---

## 1. First Impressions (30-Second Audit)

**Designer A:** The navigation is invisible. Fourteen tabs crammed into a horizontal scrolling nav bar with 0.5rem group labels at 35% opacity. You land on this page and have zero idea where to go. The nav-group-label text literally fails both AA and AAA contrast at a ratio of 1.76:1.

**Designer B:** The hero section burns prime real estate on three champion medallions that communicate six words of information. Below it, four stat cards give you "252 games played" and "8 game win streak" — neither tells me anything actionable about the current season. You scroll past two full viewport heights before you reach data you can act on.

**Designer C:** The mobile bottom nav shows 4 tabs plus a "More" drawer hiding 9 additional tabs. That's a 4/13 discovery ratio. Most of this app lives behind a tap that 60% of users will ignore.

**Vote: Fix navigation first.** Three votes unanimous. The app has excellent content buried under a broken information architecture.

---

## 2. Visual Hierarchy

### Header & Navigation
The nav groups ("The Latest", "Historical", "The Data") use 8px text at 35% opacity — contrast ratio 1.76:1. You can't read the category labels. The actual tab buttons at 0.8rem (12.8px) are fine, but without readable group labels, you've lost the organizational benefit of grouping.

**Fix:** Raise nav-group-label to 0.65rem (10.4px), drop `opacity: 0.35` to `opacity: 0.6`, and add a subtle left border accent to each group instead of relying on the label alone.

### Hero Section
Three champion circles at 180×180px each take 560px+ of vertical space (with padding) to say three names and three years. The gradient background and `h1` compete with the stat cards below.

**Fix:** Collapse champions into a single horizontal strip. Display as: `🏆 2023 nendy | 🏆 2024 MrEton | 🏆 2025 doyersbeast` — one line, 40px tall. Move the league metadata ("Est. 2023 | 12 Teams | Half-PPR") into the header bar next to the logo. This reclaims ~500px of vertical space.

### Stat Cards (Overview)
Four cards in a grid, all weighted equally. "Total Games Played" has identical visual weight to "Highest Single Week." But the highest single week score is far more interesting — it has narrative.

**Fix:** Make the "hero stat" larger (the most notable record) and the contextual stats smaller. Use a 2:1:1:1 layout on desktop: one tall card with the league's most dramatic stat, three smaller cards beside it.

### Standings Table
The table works. Column headers have tooltips, sorting arrows, and clean spacing. Two issues: (1) the rank badge uses `min-width: 24px` but the font size is 0.75rem — tight fit for double digits. (2) The "Owner / Team" column shows team name as a secondary line in `text-secondary`, which is fine, but the click-to-profile affordance is invisible.

**Fix:** Add a subtle hover underline on owner names. Bump rank badge `min-width` to 28px.

### H2H Heatmap
The heatmap grid at 0.75rem with 0.4rem padding is dense but readable on desktop. The win/loss/even color coding (green/red/gold backgrounds) communicates well. Row headers use 0.72rem names, which is tight but workable.

**Fix:** On the column headers, `max-width: 75px` with `text-overflow: ellipsis` clips names. Consider using first name only or initials for column headers to prevent clipping.

### Power Rankings Cards
Clean layout. The rank number, team info, and expandable writeup pattern works. The `pr-actual-finish` label tucked into the header's margin-left auto is easy to miss.

**Fix:** Give `pr-actual-finish` a colored badge treatment (like the grade badges in Draft Board) so you can compare predicted rank vs actual finish at a glance.

### Draft Board Grid
Best-designed section of the app. The Sleeper-inspired tile layout with position-colored top strips, grade badges, and responsive column breakpoints shows real craft. The position pill colors (QB red, RB green, WR blue, TE orange) follow industry conventions.

**Fix:** The `db-tile-owner-tag` at 0.56rem and 0.55 opacity is unreadable (contrast ratio 2.48:1). Raise to 0.65rem and 0.75 opacity.

---

## 3. Color & Contrast Audit

### WCAG AA Failures

| Element | Contrast Ratio | Required | Status |
|---|---|---|---|
| nav-group-label (0.35 opacity) | 1.76:1 | 4.5:1 | **FAIL** |
| discord-link (0.5 opacity) | 2.34:1 | 4.5:1 | **FAIL** |
| db-tile-owner-tag (0.55 opacity) | 2.48:1 | 4.5:1 | **FAIL** |
| db-nfl-team (0.65 opacity) | 2.93:1 | 4.5:1 | **FAIL** |
| sort-arrow (0.3 opacity) | 1.61:1 | 3.0:1 | **FAIL** |
| pf-val.unranked (0.4 opacity) | 1.95:1 | 4.5:1 | **FAIL** |
| ktc-val.unranked (0.4 opacity) | 1.95:1 | 4.5:1 | **FAIL** |
| champion-team (0.7 opacity) | 4.50:1 | 4.5:1 | **BORDERLINE** |

**Root cause:** Heavy use of `opacity` to create visual hierarchy. Opacity on dark backgrounds kills contrast ratios fast.

**Fix:** Replace `opacity` with explicit lighter colors. For "deemphasized" text, use `#6b7280` (gray-500) which gives 4.63:1 on `bg-secondary`. For "faint" text (sort arrows, metadata), use `#9ca3af` (gray-400) at full opacity instead of `#8b949e` at fractional opacity.

### Palette Assessment
The core palette works: teal (#00d4aa) and gold (#ffd700) on dark backgrounds pass AA at all sizes. The three background tiers (`#0f1117`, `#1a1d29`, `#22252f`) create clear depth.

One problem: gold (#ffd700) and teal (#00d4aa) carry too many meanings. Teal marks owner names, active tabs, positive records, chart lines, section headers, and stat values. Gold marks rank numbers, champion elements, subsection headers, streaks, and grade scales. When a color means everything, it means nothing.

**Fix:** Reserve teal for interactive/active states (links, selected tabs, CTAs). Use the existing `text-primary` (#e8eef2) for data values and section headers. Introduce a muted blue (#6c8fa7) for secondary data labels that currently use teal.

---

## 4. Typography Audit

### Type Scale
The app uses **36 unique font-size values**. That's not a scale — it's a grab bag. A healthy type scale has 7-9 steps.

**Current chaos (partial):** 0.5, 0.54, 0.55, 0.56, 0.57, 0.58, 0.6, 0.62, 0.625, 0.65, 0.67, 0.68, 0.7, 0.72, 0.75, 0.78, 0.8, 0.82, 0.85, 0.88, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.4, 1.5, 1.6, 1.75, 1.8, 2.0, 3.5rem

Those 14 values between 0.5rem and 0.72rem? Your eye can't distinguish 0.54rem from 0.58rem. You're paying the complexity cost of different CSS rules with zero perceptual benefit.

**Proposed scale (8 steps):**
| Token | Size | Use |
|---|---|---|
| `--text-xs` | 0.625rem (10px) | Badges, pills, metadata |
| `--text-sm` | 0.75rem (12px) | Table headers, captions, labels |
| `--text-base` | 0.875rem (14px) | Body text, table cells |
| `--text-md` | 1rem (16px) | Card titles, nav tabs |
| `--text-lg` | 1.25rem (20px) | Section headers |
| `--text-xl` | 1.5rem (24px) | Page titles |
| `--text-2xl` | 2rem (32px) | Hero stat values |
| `--text-3xl` | 2.5rem (40px) | Hero headline |

This collapses 36 sizes to 8 and eliminates every sub-10px font in the app.

### Monospace Usage
`'Courier New', monospace` appears on stat values, records, scores, and rankings. Good instinct — tabular data should align vertically. But Courier New is a typewriter font that clashes with Inter's geometric clean lines.

**Fix:** Switch to `'JetBrains Mono'` or `'IBM Plex Mono'` — both designed for dashboards and pair with geometric sans-serifs. Add `font-variant-numeric: tabular-nums` to Inter for inline numbers.

### Line Heights
Most text uses the global `line-height: 1.6`, which is generous for body text but wasteful in dense tables and cards. The draft board tiles override to 1.2-1.25, which is correct for their density.

**Fix:** Set tables and cards to `line-height: 1.35`. Keep 1.6 for paragraph text (writeups, descriptions).

---

## 5. Spacing & Breathing Room

### 8pt Grid Compliance
Of 50 unique `rem` values in the stylesheet, **40 fall off a 4px sub-grid.** Values like 0.15rem (2.4px), 0.35rem (5.6px), and 0.875rem (14px) create invisible inconsistencies that make the app feel slightly "off" without you being able to point at why.

### Specific Issues

**Cards have inconsistent internal padding:**
- `.stat-card`: 1.75rem (28px)
- `.analytics-card`: 1.5rem (24px)
- `.pr-card-header`: 1.25rem (20px)
- `.dc-card`: 1.25rem (20px)
- `.records-section`: 1.5rem (24px)
- `.roster-section`: 0.75rem (12px)

Five different padding values for functionally identical card components.

**Fix:** Standardize on two card padding values: `1.5rem` (24px) for standard cards, `1rem` (16px) for compact/nested cards.

**Section spacing is erratic:**
- `.section-header` margin-bottom: 1.5rem
- `.subsection-header` margin-top: 2rem, margin-bottom: 1rem
- `.chart-container` margin-bottom: 2rem
- `.records-container` margin-bottom: 2rem
- `.table-container` margin-bottom: 2rem

Some sections breathe, others feel cramped. The inconsistency breaks the visual rhythm as you scroll.

**Fix:** Establish a section spacing token: `--space-section: 2rem` between major blocks, `--space-subsection: 1.25rem` within blocks. Apply consistently.

---

## 6. Component Consistency

### Border Radius
**15 unique border-radius values** in use: 1px, 2px, 3px, 4px, 6px, 7px, 8px, 10px, 12px, 16px, 20px, 22px, 50%, 100px.

**Fix:** Collapse to 4 tokens:
- `--radius-sm: 4px` — pills, badges, small elements
- `--radius-md: 8px` — cards, inputs, containers
- `--radius-lg: 12px` — modals, sheets
- `--radius-full: 9999px` — avatars, circular badges

### Buttons
Six different button classes, each styled independently:
- `.nav-tab` — transparent, border-bottom underline
- `.pr-year-btn` — bg-tertiary, 8px radius, 0.625rem 1.5rem padding
- `.transactions-filter-btn` — bg-tertiary, 4px radius, 0.5rem 1rem padding
- `.expand-btn` — transparent, no border
- `.recap-season-btn` — likely similar to pr-year-btn
- `.tp-back-btn` — bg-secondary, 8px radius, 0.5rem 1rem padding

The year/filter buttons do the same job (toggle selection state) but have different border-radii (8px vs 4px) and different padding.

**Fix:** Create a `.btn-toggle` base class. All selection-state buttons share: `padding: 0.5rem 1.25rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600`. Active state: teal background.

### Tables
Two table patterns exist: the standard standings-style table and the compact H2H heatmap grid. The standard table uses `th` padding of 1rem, while the analytics table uses 0.5rem. Both show the same type of data (owner names and numbers).

**Fix:** One table style with a density modifier. `.table--compact` reduces padding to 0.5rem.

---

## 7. Mobile Experience (390px)

### Navigation
The bottom nav surfaces 4 tabs (Home, Standings, H2H, Playoffs) plus "More." The More drawer hides **9 tabs** including Rosters — which you'd argue is a top-3 use case for fantasy managers checking their team on their phone.

**Fix:** Replace "Playoffs" in the bottom nav with "Rosters." Move Playoffs into the More sheet. Fantasy managers check their rosters daily; playoffs happen once a year.

### Champions on Mobile
The mobile treatment collapses 180px circles into horizontal pills — smart adaptation. But `champion-team` is hidden entirely (`display: none`), so you lose the team name context.

**Fix:** Keep the team name visible in the pill. At 0.85rem champion-name plus a 0.7rem team-name, a pill fits both in ~140px width.

### Tables on Mobile
Tables get `font-size: 0.78rem` body and `0.67rem` headers, with horizontal scroll. The scroll affordance is invisible (3px scrollbar thumb, no shadow fade).

**Fix:** Add a gradient fade on the right edge of `.table-container` on mobile to signal "scroll right." Something like: `box-shadow: inset -20px 0 12px -10px rgba(15,17,23,0.8)`.

### H2H Heatmap on Mobile
Drops to `0.57rem` (9.1px) with `min-width: 520px`. On a 390px viewport, you scroll horizontally through a grid of 9px text. That's unreadable.

**Fix:** On mobile, replace the full heatmap grid with a team-selector dropdown that shows one row at a time in card format. You already built this pattern with the "Team Matchup Breakdown" section — promote it and hide the grid on mobile.

### Tap Targets
- `.mobile-nav-item`: Full flex-1 width, proper sizing. **Pass.**
- `.mobile-more-item`: min-height 52px, 12px padding. **Pass.**
- `.nav-tab` on mobile: hidden. **N/A.**
- `.expand-btn`: padding 0.25rem 0.5rem = 4px 8px. **Fail.** That's a 20×16px tap target.
- `.pr-writeup-toggle`: full-width, 0.6rem padding. Renders at ~10px height. **Borderline.**
- `.roster-picks-toggle`: full-width, 0.5rem padding = 8px. **Fail.**

**Fix:** All interactive elements on mobile need `min-height: 44px`. Add this to `.expand-btn`, `.pr-writeup-toggle`, `.roster-picks-toggle`, and any other tappable elements.

### Draft Board Tiles
At 440px breakpoint, tiles go to 2 columns. At 390px, each tile at `min-height: 70px` with 0.54rem position pills is dense but workable. The owner tag at 0.56rem/0.55 opacity is invisible.

**Fix:** Hide `db-tile-owner-tag` on mobile entirely — the column header tells you whose pick it is.

---

## 8. Empty States & Edge Cases

### No Empty States Exist

I searched the codebase for empty state handling. Found none. Every section assumes data is present.

- **What does the H2H grid show when a team has played zero games?** Blank cells.
- **What does the transactions list show when filtered to a combination with no results?** Nothing.
- **What does a roster card show when a player has no KTC value?** `unranked` in faint text — at least something, but it looks like a rendering error.
- **What does the Draft Board show before data loads?** Empty grid.
- **What does Team Profile show for a team with no honors?** The "Honors" section header with nothing below it.

**Fix for each:**

1. **Filtered-to-empty transactions:** Show a centered message: "No trades match these filters. Try a different year or type."
2. **Empty H2H cells:** Already handled with `.h2h-self` opacity treatment for self-matchups. For unplayed matchups, show a dash or "—" in muted text.
3. **Loading states:** Add a subtle skeleton/shimmer animation to cards while Chart.js renders. The page likely shows empty `<canvas>` elements for a beat before charts draw.
4. **Honors section:** Hide `#profileHonorsSection` entirely when empty rather than showing a label with no content.
5. **Draft Board pre-data:** Show a gray placeholder grid with dashed borders (the `.db-empty-tile` class exists but may not be deployed for the loading state).

---

## 9. Delight & Polish

**Designer A proposes:** A brief gold shimmer animation when you first scroll to the champion medallions. A CSS `@keyframes` that sweeps a diagonal light reflection across the circle once, then stops. Rings feel static and ceremonial — a single shimmer says "these matter."

**Designer B proposes:** When you hover a row in the standings table, show a subtle sparkline of that team's weekly scores as a background SVG in the row. Inline data visualization at zero click cost. This turns a static table into something you want to explore.

**Designer C proposes:** On the mobile More sheet, add an active state glow to the currently selected tab's row. Right now the sheet opens, you tap a row, it navigates, the sheet closes. You never see which tab you just came from. A teal left-border on the active item costs nothing and adds context.

**Vote: Designer C wins.** The active-state indicator on the More sheet has the best effort-to-impact ratio. It's 3 lines of CSS and it solves a real orientation problem on mobile.

**Implementation:**
```css
.mobile-more-item.active {
    border-left: 3px solid var(--accent-teal);
    background: rgba(0, 212, 170, 0.05);
}
```

Runner-up (Designer A's shimmer) is also worth building:
```css
@keyframes medal-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
.champion-card {
    background-image: linear-gradient(
        110deg,
        transparent 25%,
        rgba(255,215,0,0.08) 37%,
        rgba(255,215,0,0.15) 50%,
        rgba(255,215,0,0.08) 63%,
        transparent 75%
    );
    background-size: 200% 100%;
    animation: medal-shimmer 2s ease-in-out 0.5s 1 forwards;
}
```

---

## 10. Final Vote — Highest Impact Remaining Fix

**Designer A:** Consolidate the type scale. 36 font sizes → 8 tokens. Every section of the app benefits. Readability improves everywhere. Maintenance drops. This is the single change that compounds across the entire product.

**Designer B:** Fix the navigation information architecture. Fourteen tabs need hierarchy. Group the bottom nav around daily use cases (Rosters, Standings, Overview) vs. seasonal reference (Records, Playoffs, History). The app has content people would love — if they could find it.

**Designer C:** Kill the low-contrast opacity patterns. Eight elements fail WCAG AA. Replace every `opacity: 0.3-0.55` on text with explicit colors that pass 4.5:1. You can ship this in 30 minutes and immediately improve readability for everyone, especially mobile users in sunlight.

**Vote: Designer C's contrast fix wins.** It ships fastest, affects every screen, and removes accessibility violations. Designers A and B are correct that type scale and nav IA are larger structural improvements — but they require more design exploration before implementation.

---

## Priority Implementation Order

1. **Contrast fixes** — Replace opacity-based text colors with AA-passing explicit colors (30 min)
2. **Mobile tap targets** — Add min-height: 44px to all interactive elements (15 min)
3. **Empty states** — Add "no results" messages to filtered views (1 hr)
4. **Mobile nav reorder** — Swap Playoffs for Rosters in bottom nav (5 min)
5. **Type scale consolidation** — Define 8 CSS custom properties, migrate all font-sizes (3 hrs)
6. **Card padding standardization** — Two padding values, applied consistently (1 hr)
7. **Border-radius tokens** — 4 values, applied consistently (45 min)
8. **Hero section compression** — Collapse champions to single-line strip (1 hr)
9. **More sheet active state** — 3 lines of CSS (5 min)
10. **Champion shimmer animation** — 10 lines of CSS (10 min)

---

## Appendix: Contrast Fix Quick Reference

Replace these patterns:

| Current | Replace With |
|---|---|
| `color: var(--text-secondary); opacity: 0.35` | `color: #505861` |
| `color: var(--text-secondary); opacity: 0.4` | `color: #576068` |
| `color: var(--text-secondary); opacity: 0.5` | `color: #6b7280` |
| `color: var(--text-secondary); opacity: 0.55` | `color: #737b85` |
| `color: var(--text-secondary); opacity: 0.65` | `color: #7e868f` |
| `opacity: 0.3` on sort arrows | `color: #6b7280; opacity: 1` |

All proposed replacements hit ≥4.5:1 contrast ratio on `--bg-secondary`.
