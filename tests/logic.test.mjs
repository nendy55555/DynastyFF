// Unit tests for pure-logic functions extracted from index.html.
// Run via: node --test tests/
// Tests run without network, without Claude API, without a browser.

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Ensure the extractor has run — if the cache is missing, regenerate it automatically.
const CACHE = path.join(__dirname, '.cache', 'logic.cjs');
if (!fs.existsSync(CACHE)) {
    execSync('node ' + path.join(__dirname, 'extract.mjs'), { stdio: 'inherit' });
}

const logic = require(CACHE);
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'ktc-minimal.json'), 'utf8'));

// Inject fixtures before any test runs
before(() => {
    logic.ktcValues = fixtures.ktcValues;
    logic.ktcData = fixtures.ktcData;
    logic.fpRanks = fixtures.fpRanks;
    logic.fpData = fixtures.fpData;
    logic.ktcPickValues = fixtures.ktcPickValues;
    logic.pickProjection2026 = fixtures.pickProjection2026;
    logic.transactionData = fixtures.transactionData;
    logic.nameAliases = { 'Deandre Hopkins': 'DeAndre Hopkins' };
});

describe('normalizeName', () => {
    test('returns input when no alias exists', () => {
        assert.equal(logic.normalizeName('Bijan Robinson'), 'Bijan Robinson');
    });
    test('applies alias when defined', () => {
        assert.equal(logic.normalizeName('Deandre Hopkins'), 'DeAndre Hopkins');
    });
});

describe('getPlayerKTC / getPlayerKTCRank / getPlayerFPRank', () => {
    test('returns KTC value for direct name hit', () => {
        assert.equal(logic.getPlayerKTC('Bijan Robinson'), 9998);
    });
    test('returns rank for direct hit', () => {
        assert.equal(logic.getPlayerKTCRank('Bijan Robinson'), 1);
    });
    test('returns 0 for unknown player', () => {
        assert.equal(logic.getPlayerKTC('Nobody Famous'), 0);
    });
    test('returns "-" for unknown rank', () => {
        assert.equal(logic.getPlayerKTCRank('Nobody Famous'), '-');
    });
    test('FP rank returns "-" when missing', () => {
        assert.equal(logic.getPlayerFPRank('Nobody Famous'), '-');
    });
});

describe('getAssetKTC — players', () => {
    test('looks up known player', () => {
        assert.equal(logic.getAssetKTC('Bijan Robinson', null), 9998);
    });
    test('returns 0 for null asset', () => {
        assert.equal(logic.getAssetKTC(null, null), 0);
    });
    test('returns 0 for unknown asset', () => {
        assert.equal(logic.getAssetKTC('Fake Player', null), 0);
    });
});

describe('getAssetKTC — future picks (YYYY R#)', () => {
    test('future 1st-round from Early-tier original owner gets higher value', () => {
        const early = logic.getAssetKTC('2027 R1', 'MrEton');     // Early tier pick #3 → top-3 bump
        const late  = logic.getAssetKTC('2027 R1', 'doyersbeast'); // Late tier pick #11
        assert.ok(early > late, 'Early-tier rookie 1st should outvalue Late-tier');
    });
    test('year discount reduces picks further out', () => {
        // CONFIG.CURRENT_SEASON is hardcoded to 2025; 2028 is 3 years out.
        const y2026 = logic.getAssetKTC('2026 R1', 'MrEton');
        const y2028 = logic.getAssetKTC('2028 R1', 'MrEton');
        assert.ok(y2028 < y2026 * 0.95, 'picks further out should be discounted');
    });
    test('top-3 bump applies for first-round Early picks of owners projected 1-3', () => {
        // MrEton is pick 3 — should get the TOP3 bump of 1.15
        const withBump = logic.getAssetKTC('2026 R1', 'MrEton'); // Early, pick 3 → bump
        // shaqdeezy is pick 10 (Late) — no bump
        const noBump   = logic.getAssetKTC('2026 R1', 'shaqdeezy');
        assert.ok(withBump > noBump, 'top-3 pick should outvalue late pick in same round');
    });
    test('default tier = Mid when original owner unknown', () => {
        const v = logic.getAssetKTC('2026 R2', 'totally_fake_owner');
        assert.ok(v > 0, 'should fall back to Mid tier');
    });
});

describe('getAssetKTC — exact picks (YYYY R.SLOT)', () => {
    test('exact slot 1-4 is Early tier', () => {
        const v = logic.getAssetKTC('2024 1.02', null);
        assert.equal(v, Math.round(6800 * 1.15)); // Early 1st + top-3 bump
    });
    test('exact slot 5-8 is Mid tier, no bump', () => {
        const v = logic.getAssetKTC('2024 1.06', null);
        assert.equal(v, 5400);
    });
    test('exact slot 9+ is Late tier', () => {
        const v = logic.getAssetKTC('2024 1.11', null);
        assert.equal(v, 4800);
    });
    test('2nd-round exact picks never get top-3 bump', () => {
        const v = logic.getAssetKTC('2024 2.01', null);
        assert.equal(v, 4000); // Early 2nd, no round-1 bump
    });
});

describe('buildPickOwnershipMap', () => {
    test('pre-trade timestamp shows original ownership', () => {
        const before = fixtures.transactionData.trades[0][2] - 1;
        const map = logic.buildPickOwnershipMap(before);
        assert.deepEqual(map['2026_1']['nendy'], ['nendy']);
    });
    test('post-trade timestamp reflects transfer', () => {
        const after = fixtures.transactionData.trades[0][2] + 1;
        const map = logic.buildPickOwnershipMap(after);
        // After the trade in fixture, shaqdeezy holds nendy's 2026 R1
        const shaq = map['2026_1']['shaqdeezy'];
        assert.ok(Array.isArray(shaq), 'ownership entry must be an array');
        // Either nendy is in shaq's ownership or nendy no longer owns their own 2026 R1
        const nendyOwns = (map['2026_1']['nendy'] || []).includes('nendy');
        const shaqGot = shaq.includes('nendy');
        assert.ok(shaqGot || !nendyOwns, 'nendy pick should have moved to shaq');
    });
});

describe('resolvePickOriginalOwner', () => {
    test('returns holder when they still own their own pick', () => {
        const map = logic.buildPickOwnershipMap(0); // before any trade
        const origin = logic.resolvePickOriginalOwner(map, 'nendy', '2026', '1');
        assert.equal(origin, 'nendy');
    });
});

describe('gradeTrade', () => {
    test('balanced trade with two good assets grades near C/B for both sides', () => {
        const sides = {
            teamA: { got: ['Saquon Barkley'], gave: ['Breece Hall'] },
            teamB: { got: ['Breece Hall'],    gave: ['Saquon Barkley'] }
        };
        const r = logic.gradeTrade(sides, 0);
        assert.ok(r.teamA.grade && r.teamB.grade, 'both sides should have grades');
        // pctDiff sign should be symmetric (approximately opposite)
        assert.ok(Math.abs(r.teamA.pctDiff + r.teamB.pctDiff) < 5,
            'balanced trade pctDiff should be near symmetric, got ' + r.teamA.pctDiff + ' vs ' + r.teamB.pctDiff);
    });

    test('lopsided trade grades the winner much higher than the loser', () => {
        const sides = {
            teamA: { got: ['Bijan Robinson'], gave: ['Kyle Pitts'] },
            teamB: { got: ['Kyle Pitts'],     gave: ['Bijan Robinson'] }
        };
        const r = logic.gradeTrade(sides, 0);
        assert.ok(r.teamA.pctDiff > 0, 'teamA (got Bijan) should win');
        assert.ok(r.teamB.pctDiff < 0, 'teamB (gave Bijan) should lose');
        // teamA grade should be in A range
        assert.ok(['A+', 'A', 'B+'].includes(r.teamA.grade),
            'winner of Bijan-for-Pitts should grade A+/A/B+; got ' + r.teamA.grade);
    });

    test('returns {} for invalid input', () => {
        assert.deepEqual(logic.gradeTrade(null, 0), {});
        assert.deepEqual(logic.gradeTrade({}, 0), {});
        assert.deepEqual(logic.gradeTrade({ only: { got: [], gave: [] } }, 0), {});
    });

    test('handles trade with picks and players', () => {
        const sides = {
            teamA: { got: ['Ja\'Marr Chase'], gave: ['2026 R1', '2027 R1'] },
            teamB: { got: ['2026 R1', '2027 R1'], gave: ['Ja\'Marr Chase'] }
        };
        const r = logic.gradeTrade(sides, 9999999999999); // well after any fixture trade
        assert.ok(r.teamA.grade, 'teamA has grade');
        assert.ok(r.teamB.grade, 'teamB has grade');
        // gotVal and gaveVal should be positive numbers
        assert.ok(r.teamA.gotVal > 0 && r.teamA.gaveVal > 0);
    });
});

describe('calculateGradeStartup', () => {
    test('known top-tier player picked late = value grade', () => {
        // Bijan Robinson KTC rank 1, picked #50 in a 150-pick draft
        const g = logic.calculateGradeStartup('Bijan Robinson', 50, 150);
        assert.ok(['A+', 'A', 'A-'].includes(g), 'late pick on top player should be A-range, got ' + g);
    });
    test('unknown player falls back to positional heuristic', () => {
        const g = logic.calculateGradeStartup('Totally Fake Player', 5, 150);
        // top-7% of picks with no rank → C+ per fallback table
        assert.equal(g, 'C+');
    });
});

describe('calculateGradeKTC', () => {
    test('delegates to startup grader when draftType = startup2023', () => {
        const g = logic.calculateGradeKTC('Bijan Robinson', 50, 150, 'RB', 'startup2023');
        assert.ok(['A+', 'A', 'A-'].includes(g));
    });
    test('rookie draft with value pick grades well', () => {
        // Ja'Marr Chase rank 2 picked at #15
        const g = logic.calculateGradeKTC('Ja\'Marr Chase', 15, 48, 'WR', 'rookie2024');
        assert.ok(['A+', 'A', 'A-', 'B+'].includes(g), 'value rookie pick should grade >= B+, got ' + g);
    });
    test('unknown player returns fallback grade', () => {
        const g = logic.calculateGradeKTC('Unknown Mystery Dude', 10, 48, 'WR', 'rookie2024');
        assert.ok(['C+', 'C', 'C-', 'D+'].includes(g));
    });
});
