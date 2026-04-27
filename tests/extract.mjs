// Extracts pure-logic functions from index.html into a CommonJS module for testing.
// No build step is added to the site itself — this file only runs under `node tests/run.mjs`.
//
// Target functions (pure enough to test with injected fixtures):
//   - normalizeName
//   - getAssetKTC
//   - gradeTrade
//   - rawAdj (nested — still callable through gradeTrade)
//   - buildPickOwnershipMap
//   - resolvePickOriginalOwner
//   - calculateGradeStartup
//   - calculateGradeKTC
//   - getPlayerKTC / getPlayerKTCRank / getPlayerFPRank
//   - getStartup2023Rank
//
// Strategy: read index.html, scan for `function NAME(...)` declarations, brace-count to the
// matching close brace, emit `exports.NAME = NAME;` after them.
//
// Fragile points (document here so future-you knows what to reach for):
//   - Assumes functions are defined with `function NAME(` at column start (may be indented)
//   - Breaks if any function declaration has unbalanced braces inside string literals containing `{` or `}`
//     (this codebase doesn't do that in the targeted functions — verified as of 2026-04-20)
//   - Breaks if functions are renamed, refactored to arrow syntax, or moved to a class
//
// Run `node tests/extract.mjs` to regenerate tests/.cache/logic.cjs.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'index.html');
const OUT_DIR = path.join(__dirname, '.cache');
const OUT = path.join(OUT_DIR, 'logic.cjs');

// Functions to extract, in order
const TARGETS = [
    'normalizeName',
    'getPlayerKTC',
    'getPlayerKTCRank',
    'getPlayerFPRank',
    'getStartup2023Rank',
    'getPickProjection',
    'getAssetKTC',
    'resolvePickOriginalOwner',
    'buildPickOwnershipMap',
    'calculateGradeStartup',
    'calculateGradeKTC',
    'gradeTrade'
];

function extractFunction(source, name) {
    // Match `function NAME(...` with any whitespace. Allow leading whitespace.
    const re = new RegExp(`function\\s+${name}\\s*\\(`, 'g');
    let m = re.exec(source);
    if (!m) throw new Error(`Function '${name}' not found in source`);
    const start = m.index;
    // Skip to the opening `{` of the function body
    let i = source.indexOf('{', m.index);
    if (i < 0) throw new Error(`No opening brace for '${name}'`);
    let depth = 1;
    i++;
    // Simple brace counter. Skips content in strings to avoid `"foo}"` tripping the counter.
    while (i < source.length && depth > 0) {
        const ch = source[i];
        if (ch === '"' || ch === "'" || ch === '`') {
            // consume string literal
            const quote = ch;
            i++;
            while (i < source.length && source[i] !== quote) {
                if (source[i] === '\\') i += 2;
                else i++;
            }
            i++;
            continue;
        }
        if (ch === '/' && source[i + 1] === '/') {
            // line comment
            while (i < source.length && source[i] !== '\n') i++;
            continue;
        }
        if (ch === '/' && source[i + 1] === '*') {
            i += 2;
            while (i < source.length - 1 && !(source[i] === '*' && source[i + 1] === '/')) i++;
            i += 2;
            continue;
        }
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        i++;
    }
    if (depth !== 0) throw new Error(`Unbalanced braces extracting '${name}'`);
    return source.slice(start, i);
}

function main() {
    const html = fs.readFileSync(SRC, 'utf8');
    // Find the main <script> block and operate on the JS only
    const scriptStart = html.indexOf('<script>');
    const scriptEnd = html.lastIndexOf('</script>');
    if (scriptStart < 0 || scriptEnd < 0) throw new Error('Could not locate <script> block');
    const js = html.slice(scriptStart + '<script>'.length, scriptEnd);

    // Also extract the CONFIG constant. It's declared as `const CONFIG = { ... };` at the top of the script.
    const configMatch = js.match(/const\s+CONFIG\s*=\s*\{/);
    if (!configMatch) throw new Error('CONFIG block not found');
    const configStart = configMatch.index;
    // brace count — must skip strings AND comments. A CONFIG comment like
    // `KTC's "1QB"` would otherwise enter "string mode" on a stray apostrophe
    // and over-run far past the real close brace.
    let i = js.indexOf('{', configStart);
    let depth = 1;
    i++;
    while (i < js.length && depth > 0) {
        const ch = js[i];
        // Skip line comments
        if (ch === '/' && js[i + 1] === '/') {
            while (i < js.length && js[i] !== '\n') i++;
            continue;
        }
        // Skip block comments
        if (ch === '/' && js[i + 1] === '*') {
            i += 2;
            while (i < js.length - 1 && !(js[i] === '*' && js[i + 1] === '/')) i++;
            i += 2;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
            const q = ch; i++;
            while (i < js.length && js[i] !== q) { if (js[i] === '\\') i += 2; else i++; }
            i++; continue;
        }
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        i++;
    }
    // Include the trailing `;`
    if (js[i] === ';') i++;
    const configSrc = js.slice(configStart, i);

    const extracted = TARGETS.map(name => extractFunction(js, name)).join('\n\n');

    const out = `
// AUTO-GENERATED by tests/extract.mjs. Do not edit by hand.
// Regenerate with: node tests/extract.mjs
// Source: index.html

'use strict';

// ─── Injected globals (fixtures are assigned by the test harness) ───
let ktcData = {};
let ktcValues = {};
let fpData = {};
let fpRanks = {};
let ktcPickValues = {};
let pickProjection2026 = {};
let transactionData = { trades: [] };
let nameAliases = {};
let startup2023Ranks = {};
let allTimeData = {};
// No-op DOM stubs used by some functions
const console = { warn(){}, error(){}, log(){} };

${configSrc}

${extracted}

module.exports = {
    // injection points
    set ktcData(v) { ktcData = v; }, get ktcData() { return ktcData; },
    set ktcValues(v) { ktcValues = v; }, get ktcValues() { return ktcValues; },
    set fpData(v) { fpData = v; }, get fpData() { return fpData; },
    set fpRanks(v) { fpRanks = v; }, get fpRanks() { return fpRanks; },
    set ktcPickValues(v) { ktcPickValues = v; }, get ktcPickValues() { return ktcPickValues; },
    set pickProjection2026(v) { pickProjection2026 = v; }, get pickProjection2026() { return pickProjection2026; },
    set transactionData(v) { transactionData = v; }, get transactionData() { return transactionData; },
    set nameAliases(v) { nameAliases = v; }, get nameAliases() { return nameAliases; },
    set startup2023Ranks(v) { startup2023Ranks = v; }, get startup2023Ranks() { return startup2023Ranks; },
    set allTimeData(v) { allTimeData = v; }, get allTimeData() { return allTimeData; },
    CONFIG,
${TARGETS.map(n => `    ${n},`).join('\n')}
};
`;
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT, out);
    console.log('Extracted', TARGETS.length, 'functions ->', OUT);
}

main();
