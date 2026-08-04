# Boho Mini Crossword library plan

Status: local design and interaction prototype. No production publication is
authorized by this document.

## Product target

The next crossword format should be a true 4×4 mini: sixteen playable cells,
four Across answers, four Down answers, and every letter checked by a crossing.
Version one should use a fully open grid. Across and Down answers must be
different, which makes this a double word square rather than the much easier
single word square where every answer is repeated.

The solver should open on 1 Across and support the interaction model already
implemented in the local preview:

- typing fills the active answer and advances one square;
- clicking the active intersection or pressing Space switches Across/Down;
- arrows move geometrically and adopt the corresponding direction;
- Enter or Tab moves to the next clue in the current direction;
- Shift+Enter or Shift+Tab moves to the previous clue;
- Backspace clears the current letter, then backs up and clears;
- clicking a clue selects its first unanswered square;
- the active square, active answer, clue bar, and clue-list row stay highlighted.

These choices match widespread web-crossword conventions. USA Today documents
Enter/Tab for the next clue, arrows for cells, and Space for direction; Lovatts
documents Tab/Space/Enter for the next clue and arrows for cells; other current
players use Space or a repeated cell click to switch Across/Down.

References:

- https://content-static.usatoday.com/puzzles/crossword.html
- https://lovattspuzzles.com/quick-crossword/
- https://www.thepuzzlelabs.com/crossword

## Canonical puzzle record

Puzzle bodies should be immutable JSON generated offline. The browser must not
need an LLM or database query to play.

```json
{
  "schemaVersion": 1,
  "id": "mini4-000001",
  "size": 4,
  "grid": "ABCDEFGHIJKLMNOP",
  "entries": [
    {"number": 1, "direction": "across", "answer": "ABCD", "clue": "Example clue"}
  ],
  "difficulty": "easy",
  "tags": ["general"],
  "authoring": {
    "method": "llm-assisted",
    "promptVersion": "mini4-v1",
    "reviewState": "approved"
  },
  "fingerprint": "sha256-of-normalized-grid-and-clues"
}
```

The validator should derive numbering and cell membership from the grid, then
reject any record whose supplied entries disagree. Production packs should omit
answers from any separately exposed catalog or manifest; answers remain inside
the puzzle payload the browser already needs.

## Authoring pipeline

LLM generation is appropriate here, but its output must be treated as an
untrusted submission rather than a publishable puzzle.

1. **Fill construction.** A deterministic constraint solver builds valid 4×4
   double word squares from a reviewed four-letter lexicon. An LLM may also
   propose complete fills, but they enter the same validation path.
2. **Clue drafting.** An LLM writes several concise clue candidates per answer,
   using the requested difficulty and style. It receives the complete crossing
   set so it can avoid making two obscure answers cross.
3. **Structural validation.** Recompute all eight entries, confirm lengths and
   crossings, prohibit duplicate answers, validate every answer against the
   reviewed lexicon, and reject malformed or repeated puzzle fingerprints.
4. **Editorial validation.** Check clue-answer agreement, ambiguity, factual
   accuracy, tense and part-of-speech agreement, offensive material, accidental
   personal data, trademarks, and reliance on short-lived news facts.
5. **Independent critique.** A second prompt/model scores every clue for
   correctness, freshness, fairness, and difficulty. Low-confidence records are
   rejected rather than repaired silently.
6. **Human sampling.** Review every initial launch puzzle. Once rejection rates
   and automated scores are stable, sample each generated batch and continue
   reviewing all flagged clues.
7. **Pack and sign.** Normalize records, create content hashes, produce a batch
   report, and write immutable compressed packs plus a small manifest.

Required batch artifacts:

- accepted and rejected puzzle IDs;
- rejection reasons and validator version;
- prompt and model identifiers without credentials;
- duplicate/frequency report for answers and clue phrasings;
- difficulty distribution;
- signed pack checksums.

### Candidate API decision

Datamuse is the approved candidate-word input for the prototype authoring
pipeline. It currently permits 100,000 requests per day without a key through
December 31, 2026, and documents the same daily allowance behind a required key
starting January 1, 2027. One complete four-letter refresh costs 26 requests—one
per starting letter—so quota is not a meaningful constraint. Run:

```bash
npm run games:author-mini4 -- --limit=500 --min-frequency=5
```

The command emits untrusted candidate double word squares. It rejects proper
names, low-frequency records, non-words, and a base content blocklist before the
normal structural and editorial gates. It does not generate clues or publish
anything. There is no acceptable high-volume finished-crossword API in the
current review: available services either have tiny free quotas, unclear reuse
rights, or require keyed commercial plans.

## Cheap unlimited delivery

Do not create one deployed file per puzzle. Package 128–512 puzzles into each
versioned JSON pack and expose a manifest containing pack IDs, puzzle counts,
and checksums. The client downloads one pack, caches it, and walks a seeded
pseudorandom permutation while storing only a bounded list of played IDs.

At roughly 1–2 KB of compact JSON per puzzle, 100,000 puzzles are approximately
100–200 MB before compression. That is small enough to begin as static site
assets. If the library outgrows convenient site builds, move the immutable packs
to R2 and keep the same URLs behind Cloudflare caching. Cloudflare currently
includes 10 GB-month of Standard R2 storage and 10 million Class B reads per
month; egress is free. D1 should hold only a small catalog or operational state,
not serve a row for every play. Its free tier currently includes 5 million rows
read per day and 5 GB total account storage, but each database is limited to 500
MB on the Free plan.

Current Cloudflare references:

- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/pages/platform/limits/

## Rollout

### Phase 1 — interaction foundation

Complete in the local preview: active square/answer, synchronized clues,
Across/Down switching, familiar keyboard navigation, persistence, checking, and
anonymous completion compatibility.

### Phase 2 — real 4×4 format

- define the TypeScript schema and pure validator;
- implement the double-word-square fill solver;
- hand-author and review 25 launch-quality puzzles;
- replace runtime `crossword-layout-generator` use with deterministic selection
  from immutable puzzle records;
- add fixtures for numbering, crossings, navigation, persistence, and solve
  completion.

### Phase 3 — LLM production run

- generate a 1,000-puzzle candidate batch;
- require structural validation and independent clue critique;
- manually review the accepted launch set and every flagged record;
- measure rejection reasons, repeated clue patterns, and actual solve feedback;
- tune prompts and lexicon before scaling.

### Phase 4 — large library

- generate and validate 25,000–100,000 records offline;
- publish immutable compressed packs and a manifest;
- keep selection local and account-free;
- record only opt-in aggregate outcomes, never puzzle answers, typed entries, or
  a stable player identifier.

## Production acceptance gates

- all eight answers are valid, distinct, and fully crossed;
- no two obscure/proper-noun answers cross;
- clues are factually correct and match answer form;
- no duplicate grid fingerprint and controlled answer/clue repetition;
- keyboard, pointer, touch, screen-reader labels, reduced motion, persistence,
  and completion reporting pass fixtures and browser QA;
- packs reproduce byte-for-byte from their source records and checksums;
- no LLM call, external puzzle API, account, or per-play database read is needed
  by the browser.
