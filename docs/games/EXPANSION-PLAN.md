# Boho Games expansion plan

The dedicated 4×4 Mini Crossword authoring, validation, interaction, and storage
plan lives in `docs/games/CROSSWORD-LIBRARY-PLAN.md`.

Status: 2048 is implemented. The pinned Tatham Pattern and Mines assets and the
first shared Nonogram host are implemented for local preview only; no part of
this document authorizes deployment.

Mahjong Solitaire is now implemented as a native local-preview game using the
canonical 144-tile, five-level Turtle layout with half-tile overlap geometry,
deterministic solvable deals, client-only CSS 3D tile bodies, Unicode tile
faces, hints, undo, local resume, and an aggregate-only completion bucket. The
implementation was informed by the MIT-licensed `ffalt/mah` project pinned in
`docs/games/vendor/mah.lock.json`; no upstream mixed-license artwork ships and
gameplay/rendering consumes no Worker CPU.

## Connections: approved future name and shape

The owner selected **Connections** as the reader-facing working name for the
future word-grouping game. It should present sixteen terms hiding four groups
of four, allow four submitted selections, explain each category after it is
found, and provide unlimited authored rounds. Puzzle packs must be reviewed for
unambiguous membership, accidental alternate groupings, cultural currency, and
clue tone before release. State remains local; optional aggregate reporting may
send only `solved|lost` and a coarse mistakes bucket.

`Connections` is associated with The New York Times word game. The requested
working label can be used in local preview, but public naming and presentation
require the same release review already recorded for Wordle.

## Decision

Build 2048 as a small native Boho web module. Build Minesweeper and Nonogram on
one reusable Simon Tatham Portable Puzzle Collection WebAssembly host, using the
upstream games named `mines` and `pattern`. Keep generation and play in the
browser so unlimited rounds do not consume Worker CPU or database writes.

The initial upstream pins to evaluate are:

- Simon Tatham's Portable Puzzle Collection commit
  `3c3632259d298ab62aafa8a5858823569ab1af46` (2026-07-20 release line),
  MIT: <https://www.chiark.greenend.org.uk/~sgtatham/puzzles/>
- Gabriele Cirulli's original 2048 repository, commit
  `478b6ec346e3787f589e4af751378d06ded4cbbc`, MIT:
  <https://github.com/gabrielecirulli/2048>

Do not copy code from random clones. Preserve upstream authorship and full MIT
notices in `docs/games/THIRD-PARTY-NOTICES.md` and in the distributed asset
directory.

## Shared delivery shape

Each game route remains an Astro shell with externally emitted CSS and a
client-only engine. A common adapter exposes:

```ts
interface BohoPuzzleAdapter {
  newGame(options?: Record<string, string>): Promise<void>;
  restart(): void;
  serialize(): string;
  restore(saved: string): boolean;
  destroy(): void;
}
```

Every route uses `boho-games:v2` only for unfinished state and local totals. A
finished round may call the existing optional score API with a game, variant,
outcome, and coarse score bucket. Answers, board state, random seeds, move
history, and exact times never go to the score API.

## 2048: native Boho implementation

1. At intake, pin the current upstream commit and extract only the MIT-licensed
   engine concepts and small JavaScript modules needed for `Grid`, `Tile`, move
   merging, scoring, and input. Do not import the legacy page, analytics hooks,
   application cache, or upstream presentation wholesale.
2. Put adapted logic under `src/lib/games/2048/` and the route at
   `src/pages/games/2048.astro`. Keep the engine deterministic under an injected
   random-number function so tests can assert exact board transitions.
3. Render a Boho-native 4×4 DOM grid with keyboard, swipe, restart, continue
   after 2048, and undo only if deliberately approved later. Store the current
   board and best local score in browser storage.
4. Unit-test all four move directions, one-merge-per-tile behavior, score
   increments, loss detection, win/continue behavior, deterministic tile
   placement, corrupted saves, and keyboard/swipe parity.
5. Report optional aggregate buckets such as `<512`, `512`, `1024`, `2048`,
   `4096+`; do not send the exact board or move history.

Estimated implementation: one focused pass after intake, then mobile/browser
QA. This is independent of the C/WASM toolchain.

## Portable Puzzle Collection: mine the goldmine once

The collection already provides the hard parts: seeded generation, validation,
solvers, undo/redo, serialization, input handling, and a browser front end. Its
official architecture is C puzzle back ends behind a portable front-end API:
<https://www.chiark.greenend.org.uk/~sgtatham/puzzles/devel/>. The mid-end owns
one puzzle session and supports serialization:
<https://www.chiark.greenend.org.uk/~sgtatham/puzzles/devel/midend.html>.

The inspected upstream pin contains exactly the web path we need:

- `mines.c` and `pattern.c` are registered by `puzzle(mines)` and
  `puzzle(pattern)` in `CMakeLists.txt`;
- `cmake/platforms/emscripten.cmake` builds one `.js` and `.wasm` pair per game,
  with memory growth and explicit input/save/load exports;
- `emcc.c`, `emccpre.js`, and `emcclib.js` provide the shared canvas, input,
  preferences, permalink, and save/load bridge; and
- `html/jspage.pl` generates the DOM contract the bridge expects.

The concrete integration sequence is:

1. **Reproducible upstream intake.** On the Pi, mirror the pinned upstream into
   `/srv/local1/vendor` as machine-local dependency state. Check into this repo
   only a lock manifest (source URL, commit, license digest), patch series, build
   script, and resulting reviewable web assets if policy permits. Never make an
   unpinned network download part of the public-site build.
2. **One build pipeline.** Add `scripts/games/build-tatham.sh` that requires the
   pinned vendor checkout and an approved pinned Emscripten container/toolchain,
   configures CMake for Emscripten, and builds only `mines` and `pattern`. Copy
   hashed `.js`/`.wasm` outputs and MIT notices to
   `public/vendor/tatham/<commit>/`. Record SHA-256 digests. The normal Astro
   build consumes those static files and does not require Emscripten.
3. **One host component.** Create `TathamPuzzleHost.astro` with the upstream DOM
   IDs expected by `emccpre.js`: canvas pair, containing/resizable elements,
   status, game-type menu, new/restart/undo/redo controls, configuration dialogs,
   and save/load plumbing. Load the game script with `defer` and supply the
   `.wasm` beside it. Style this contract from `GamesLayout` or one external
   game asset so the governed publisher cannot strip it.
4. **Small maintained adapter patch.** Patch the upstream browser front end only
   at defined seams: emit a `boho-puzzle-complete` DOM event when the mid-end
   reaches completion, expose safe quick-save/quick-load calls using the existing
   save-file functions, and namespace preference storage. Keep the patch minimal
   and replayable against a new upstream pin.
5. **State and accessibility wrapper.** The Boho host saves serialized state
   locally after moves and restores it defensively. It supplies headings,
   instructions, focus management, high-contrast controls, reduced-motion
   behavior, and touch sizing around the upstream canvas. Canvas accessibility
   must be tested; if a puzzle is not usable with keyboard and a screen reader,
   disclose that limitation and schedule a DOM renderer rather than claiming
   full accessibility.
6. **Update discipline.** A dedicated update command fetches a proposed new
   upstream commit into `/srv/local1/vendor`, compares license and web-API files,
   reapplies the patch, rebuilds, runs fixture game IDs, and outputs digests.
   Updating the pin is its own reviewed commit, never an automatic production
   pull.

## Minesweeper using `mines`

Public route: `/games/minesweeper/`; public name: **Minesweeper**; attribution:
“Powered by the MIT-licensed Mines engine from Simon Tatham's Portable Puzzle
Collection.”

1. First ship the shared canvas host with Beginner, Intermediate, and Expert
   presets mapped to upstream `mines` parameters. Preserve upstream first-click
   safety and solver-backed generation.
2. Expose New, Restart, Undo, Redo, and difficulty controls through the host.
   Support pointer, touch, and upstream keyboard controls; verify long-press or
   an explicit Flag mode on touch rather than depending on right-click.
3. Store only the serialized current game locally. Completion stats use
   `game=minesweeper`, difficulty variant, `won|lost`, and a broad time bucket
   only if a visible timer is later added.
4. QA fixed seeds/game descriptions for win, loss, flagging, chord behavior,
   resize, save/restore, and one hundred generated boards per preset in a
   non-browser generator smoke test.

## Nonogram using `pattern`

Public route: `/games/nonogram/`; public name: **Nonogram**; attribution names
the upstream **Pattern** engine.

1. Use Pattern as the first adapter proof because it exercises generation,
   row/column clues, filled/empty/unknown cell input, completion, undo/redo, and
   serialization without a timer.
2. Start with upstream presets that remain legible on phones. Map them to clear
   Boho labels such as Small, Medium, and Large; retain exact upstream parameters
   in the saved game ID.
3. Provide explicit Fill and Mark-empty touch modes plus keyboard help. Do not
   rely on mouse-button distinctions alone.
4. Completion stats use `game=nonogram`, size variant, `solved`, and no exact
   duration. QA fixed game IDs, clue rendering, touch modes, completion event,
   save/restore, resize, dark/light contrast, and generated-board smoke tests.

## Expansion after those two

Once `TathamPuzzleHost` works, adding another collection game becomes a bounded
adapter intake instead of a new architecture. Maintain a compatibility matrix
for mobile input, keyboard access, canvas complexity, completion signal,
serialization, typical generation cost, and preset sizes. The best next
candidates to evaluate are Net, Loopy, Bridges, Keen, Towers, Mosaic, and
Unruly. Add no game solely because it compiles: it must pass the same mobile,
accessibility, persistence, licensing, and deterministic-fixture gates.

## Release gates

- exact upstream commits and MIT notices recorded;
- no third-party network request during play;
- normal site build works without Emscripten or network access;
- `.wasm` served with `application/wasm` and immutable caching;
- fixed-seed generation and save/restore tests pass;
- keyboard, touch, small-screen, light/dark, and reduced-motion QA pass;
- optional stats schema and Privacy Policy updated before enabling new result
  types;
- exact Pi-authored commit approved before public GitHub push and governed
  production deployment.
