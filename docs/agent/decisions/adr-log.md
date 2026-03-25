# Architecture decision log

> Full record of significant decisions. `DECISIONS.md` has the active summary.
> Add an entry here every time a decision is made or reversed.

---

### ADR-005: Championship ring click-through to season recap
**Date:** 2026-03-24
**Status:** Accepted
**Decided by:** Thomas

**Context:** Champion icons on the overview page were static. Users wanted to navigate directly to the season recap from the ring display.

**Options considered:**
1. Static icons — simple but no navigation
2. Clickable rings that open recap tab — adds discoverability

**Decision:** Made championship rings clickable, navigating to the corresponding season recap.

**Consequences:**
- Adds a navigation entry point from Overview to Recaps
- Rings now require a `data-season` attribute in the HTML markup

---

### ADR-004: League title as hyperlink to Sleeper
**Date:** 2026-03-24
**Status:** Accepted
**Decided by:** Thomas

**Context:** Users wanted to jump directly to the Sleeper league page from the dashboard.

**Decision:** Made the league title in the header a hyperlink to the Sleeper league URL.

**Consequences:** Header now has an `<a>` tag around the title — style it to not look like a standard link.

---

### ADR-003: Playoff bracket seeds show entry seeds, not slot IDs
**Date:** 2026-03-24
**Status:** Accepted
**Decided by:** Thomas

**Context:** The playoff bracket was displaying internal Sleeper slot IDs instead of the seeds teams actually entered with (e.g. showing "3" when the team was the #2 seed).

**Decision:** Updated bracket rendering to show actual entry seeds rather than slot IDs.

**Consequences:** Seeds now match what managers remember from the season — clearer communication.

---

### ADR-002: KTC pick discount of 10%
**Date:** 2023 (founding)
**Status:** Accepted
**Decided by:** Thomas

**Context:** Draft picks tend to be overvalued on KTC relative to what they actually trade for in real league transactions.

**Options considered:**
1. Use raw KTC values
2. Apply a flat discount
3. Apply a sliding discount based on years out

**Decision:** Apply a flat 10% discount to all KTC pick values.

**Consequences:**
- Pick values display lower than raw KTC
- Trade grades for pick-heavy trades will show lower value for the pick-receiving side
- The 10% figure is a rough heuristic — revisit if league trading patterns suggest a different number

---

### ADR-001: Single HTML file architecture
**Date:** 2023 (founding)
**Status:** Accepted
**Decided by:** Thomas

**Context:** Building a dynasty league dashboard for personal/league use. Needed to be easy to maintain, share, and deploy with no toolchain.

**Options considered:**
1. React + Vite + separate files — full development environment, harder to share
2. Single HTML file with embedded CSS/JS — no toolchain, opens in any browser, trivially hosted
3. Vue or Svelte — similar tradeoffs to React

**Decision:** Single HTML file with all CSS, JS, and data embedded.

**Consequences:**
- File grows large (~7700 lines as of 2026) — navigating requires search
- No module system — all functions and data are global
- Deployment = git push (GitHub Pages)
- No automated testing possible without a test runner setup
- Easy for any contributor to open, edit, and preview

---

> Add new decisions above this line in reverse chronological order (newest first).
