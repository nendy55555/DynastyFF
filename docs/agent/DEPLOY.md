# Deployment guide

> Read this before any deploy. Push to main = live. There is no staging.

---

## Environments

| Environment | URL | Trigger | Notes |
|---|---|---|---|
| Local | Open `index.html` in browser | No server needed | All features work except KTC refresh (needs internet) |
| Production | https://nendy55555.github.io/DynastyFF/ | Push to `main` branch | Auto-deploys via GitHub Pages, typically within 60 seconds |

There is no staging environment. If you need to test before going live, open `index.html` locally in a browser.

---

## Deploy to production

```bash
# 1. Test locally — open index.html in a browser, click through affected tabs
#    (no npm, no build, no server required)

# 2. Stage your changes
git add index.html

# 3. Commit
git commit -m "your message"

# 4. Push to main
git push origin main

# 5. Verify live within ~60 seconds
# Open https://nendy55555.github.io/DynastyFF/ and hard-refresh (Cmd+Shift+R)
```

**How to know it worked:** The live URL reflects your change after a hard refresh. GitHub Pages has no health endpoint — visual confirmation is the only check.

---

## Pre-deploy checklist

Before pushing:
- [ ] Open `index.html` locally and navigate to every tab you modified
- [ ] Open browser DevTools Console — confirm zero JS errors
- [ ] If you modified a chart, confirm it renders and doesn't throw Chart.js errors
- [ ] If you modified data (allTimeData, transactionData, etc.), spot-check a few values against source data
- [ ] Run `git diff HEAD -- index.html` and read the diff — confirm no unintended changes

**Never push if:**
- Browser console shows JS errors
- Any tab you touched fails to render
- The file has a syntax error (page goes blank or shows raw HTML)

---

## Common deploy failures

| Symptom | Likely cause | Fix |
|---|---|---|
| Page goes blank after deploy | JS syntax error in index.html | Open DevTools Console — it shows the exact line. Fix and re-push. |
| Changes don't appear on live site | GitHub Pages cache | Hard-refresh (Cmd+Shift+R) or wait 2 minutes |
| Chart breaks after data update | Field name mismatch between data and render function | Check `reference/data-models.md` for correct key names |
| KTC values don't load | CORS proxy is down | This is an external dependency — no fix on our side; feature degrades gracefully |

---

## Rollback

```bash
# Roll back to the previous commit
git revert HEAD --no-edit
git push origin main

# Or revert to a specific commit
git log --oneline -10          # find the commit hash
git revert [hash] --no-edit
git push origin main
```

Revert is preferred over `reset --hard` — it keeps history clean and GitHub Pages auto-deploys the revert.

---

## Environment variables

There are none. This is a fully static site with no server-side secrets. The only "config" is the CORS proxy URL used for KTC value fetching, which is hardcoded in the JS. See `reference/env-vars.md`.
