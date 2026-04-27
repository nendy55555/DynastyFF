# DEBUG.md — Dynasty FF site debugging notes

Living doc. Append new incidents at the bottom; fix recipes go inline with the bug.

## Site architecture in 30 seconds

Single static page (`index.html`) deployed to GitHub Pages from `origin/main`, served via custom domain `thomasnendick.com/DynastyFF/`. Everything is inline — one big `<script>` block (~313K of JS) at the bottom of `<body>`. There is no build step. A push to `main` triggers a Pages rebuild that takes 30–60 seconds to propagate.

The script's structure:
1. `<head>`: external scripts (Chart.js, fonts) loaded with SRI hashes.
2. `<body>`: HTML markup for every tab (`.tab-content` divs) + a few small modals.
3. Inline `<script>`: ~8200 lines containing CONFIG, large `const` data blocks, top-level IIFEs that read those data blocks, init functions, and a `DOMContentLoaded` handler that calls each tab's `init*()` via a `safeInit` wrapper.

Critical invariant: **every top-level IIFE runs during `<script>` parse, in source order.** If an IIFE reads a `const` declared *after* it, you hit TDZ and the entire `<script>` halts.

## Common failure modes

### 1. "Tab X is empty / data didn't load" (silent halt)

**Symptom:** Several tabs render their HTML shell (header, container divs) but no data. Sometimes only Power Rankings is empty; usually it's everything below a certain line.

**Diagnosis:** open DevTools → Console → Errors. Look for:
- `ReferenceError: Cannot access 'X' before initialization` — TDZ. The variable is declared with `const`/`let` after the line that's reading it.
- `SyntaxError: ...` — broken JS. Could be an orphan `} catch` (try/catch split by a comment merge) or unbalanced braces.

Either error halts the entire inline `<script>` and every `const`/`function` declared below the failure point never gets created. That's why you see *cascading* tab failures, not just one.

**TDZ fix recipes** (best to worst):
1. Defer the IIFE: change `(function name() {...})()` to `setTimeout(function name() {...}, 0)`. Body runs on next tick when all `const`s have initialized. **Use this for non-DOM, side-effect IIFEs.**
2. Move the IIFE down past the data declaration. Safer than moving 50KB of data up.
3. Move the data declaration above the IIFE. Only do this if the data block is small.
4. **Do NOT** rely on `?.` optional chaining to fix TDZ — TDZ throws at variable access, before `?.` evaluates. `transactionData?.trades` still throws if `transactionData` is in TDZ.

### 2. "Last commit pushed but live site shows old content"

GitHub Pages CDN can cache for ~600 seconds. To force a fresh fetch:
- Add a cachebuster: visit `thomasnendick.com/DynastyFF/?cb=N#tabname`.
- Or wait 30–60 seconds and hard-refresh (`Cmd+Shift+R`).
- For aggressive cache state in localStorage (KTC/FP cached values), open DevTools console and run `localStorage.clear(); location.reload(true);`.

Diagnostic: `curl -sLI 'http://thomasnendick.com/DynastyFF/'` — check `Last-Modified` and `ETag`. If those reflect your push timestamp, the deploy is live.

### 3. "Branch switch broke everything"

Verified incident on 2026-04-27. Two branches existed: `main` (canonical) and `master` (divergent, missing `powerRankingsData`). Pages source was on `main`. Bringing WIP from `master` into `main` introduced three independent bugs (two TDZ, one syntax error). See SESSION-STATE.md for the full incident write-up.

Lesson: before merging WIP from another branch, run the TDZ-landmine detection script below and the parse check (`node -e "new Function(scriptBody)"`).

## TDZ landmine detection script

Run from repo root. Reports every top-level IIFE that references data declared after it. Comment-aware so false positives stay quiet.

```bash
python3 << 'EOF'
import re

with open('index.html') as f: html = f.read()
js = re.search(r'<script(?![^>]*src=)[^>]*>([\s\S]*?)</script>', html).group(1)
js_offset = re.search(r'<script(?![^>]*src=)[^>]*>', html).end()

def line_of(pos): return html[:js_offset + pos].count('\n') + 1

# Top-level const data declarations
decls = {}
for m in re.finditer(r'^        const\s+(\w+)\s*=\s*[\{\[]', js, re.MULTILINE):
    decls.setdefault(m.group(1), line_of(m.start()))

# Top-level IIFEs (8-space indent)
iife_re = re.compile(r'^        \(function\b.*?\{|^        setTimeout\(function\b', re.MULTILINE)

def find_body(start_pos):
    depth, i = 1, start_pos
    while i < len(js) and depth > 0:
        ch = js[i]
        if ch == '/' and js[i+1] == '/':
            while i < len(js) and js[i] != '\n': i += 1; continue
        if ch == '/' and js[i+1] == '*':
            i = js.index('*/', i+2) + 2; continue
        if ch in '"\'`':
            q = ch; i += 1
            while i < len(js) and js[i] != q:
                if js[i] == '\\': i += 2
                else: i += 1
            i += 1; continue
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
        i += 1
    return js[start_pos:i-1]

violations = 0
for m in iife_re.finditer(js):
    body = find_body(m.end())
    # Strip comments before checking refs
    no_comments = re.sub(r'//[^\n]*', '', body)
    no_comments = re.sub(r'/\*[\s\S]*?\*/', '', no_comments)
    iife_line = line_of(m.start())
    deferred = 'setTimeout' in m.group(0)
    for name, decl_line in decls.items():
        if decl_line > iife_line and re.search(r'\b' + re.escape(name) + r'\b', no_comments):
            if not deferred:
                violations += 1
                print(f'⚠️  IIFE @ L{iife_line} reads {name} (declared L{decl_line}) — TDZ RISK')
print(f'\n{"OK — no TDZ landmines" if violations == 0 else f"FOUND {violations} TDZ violations"}')
EOF
```

## Parse check (catches syntax errors before push)

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const matches = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)];
matches.forEach((m, i) => {
  try { new Function(m[1]); console.log('Script', i, 'len', m[1].length, 'OK'); }
  catch (e) { console.log('Script', i, 'PARSE FAIL:', e.message); }
});
"
```

## Headless top-level execution check (catches TDZ at runtime)

```bash
node -e "
const fs = require('fs');
const big = [...fs.readFileSync('index.html','utf8').matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)][0][1];
const makeEl = () => { const e = { classList:{add:()=>{},remove:()=>{},contains:()=>false,toggle:()=>{}}, addEventListener:()=>{}, style:{cssText:''}, innerHTML:'', textContent:'', value:'', appendChild:()=>{}, removeChild:()=>{}, setAttribute:()=>{}, getAttribute:()=>null, hasAttribute:()=>false, dataset:{}, parentElement:null, children:[] }; e.querySelector=()=>makeEl(); e.querySelectorAll=()=>[]; e.closest=()=>makeEl(); e.insertBefore=()=>{}; return e; };
global.window={location:{hash:''},addEventListener:()=>{},pageYOffset:0,scrollTo:()=>{}};
global.document=Object.assign(makeEl(),{getElementById:()=>makeEl(),querySelectorAll:()=>[],querySelector:()=>makeEl(),addEventListener:()=>{},body:makeEl(),createElement:()=>makeEl(),createTextNode:()=>makeEl()});
global.localStorage={getItem:()=>null,setItem:()=>{}};
global.fetch=()=>Promise.reject(new Error('stub'));
global.setTimeout=(fn,ms)=>{};
global.Chart={register:()=>{},defaults:{font:{},plugins:{legend:{labels:{}}}}};
global.history={pushState:()=>{},replaceState:()=>{}};
global.location=global.window.location;
global.MutationObserver=class{constructor(){};observe(){};disconnect(){}};
try { new Function(big)(); console.log('TOP-LEVEL EXEC: NO TDZ ERRORS'); }
catch (e) { console.log(e.message.includes('before initialization')?'TDZ FOUND: '+e.message:'Non-TDZ stub error: '+e.message); }
"
```

A "Non-TDZ stub error" is fine — that just means execution went past every `const` declaration and hit a DOM API the stub doesn't cover. As long as you don't see `before initialization`, no TDZ.

## Pre-push checklist

1. `node parse-check` (above) → all scripts OK
2. `python3 tdz-landmine` (above) → no TDZ landmines
3. `node headless-exec` (above) → no TDZ runtime
4. Push to `main`, wait 45 seconds for Pages
5. Open `thomasnendick.com/DynastyFF/?cb=N#powerrankings` and visually confirm Power Rankings cards render. If empty, walk through the failure modes above.

## Incident log

### 2026-04-27 — TDZ + syntax error cascade ("Power Rankings is empty")
- Branch switch from `master` introduced three bugs in `index.html` that all silenced the inline `<script>`. Two were TDZ violations (validateData, populateOverviewStats), one was a syntax error (orphan `} catch`).
- Fixed in commits `83d6c01`, `72cae57`, `6384c16`, `b33a3bd`.
- Recovery time: ~30 minutes including diagnosis, fix, deploy, and full-tab visual QA.
- Root cause: WIP from a divergent branch (`master`) was merged with no parse check. Pre-push checklist above now exists to prevent recurrence.
