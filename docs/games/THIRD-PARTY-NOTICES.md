# Boho Games third-party notices

The local Boho Games prototypes use the following permissively licensed inputs.

## Datamuse authoring input

- Service: Datamuse API
- Project: <https://www.datamuse.com/api/>
- Use: offline candidate-word discovery, frequency ranking, and part-of-speech
  filtering for the reviewed 4×4 Mini Crossword authoring pipeline.

Datamuse is not called by the game or by production requests. Candidate words
are filtered locally; Boho-authored clues and validated puzzle records are
quality-gated and distributed in immutable local packs. The API documentation requests public
acknowledgment when used by an application.

## SudokuGen

- Package: `sudoku-gen` 1.0.2
- Project: <https://github.com/petewritescode/sudoku-gen>
- Copyright: Pete Williams
- License: MIT
- Use: produces fast, solvable Sudoku permutations from reviewed seed puzzles.

## Wordle allowed-guess dictionary

The allowed-guess dictionary is generated from the FreeBSD `web2` word list,
derived from Webster's Second International dictionary. The source README says
the 1934 copyright has lapsed. Boho's displayed answer pool is independently
curated and is not copied from The New York Times Wordle answer list.

`Wordle` is a New York Times trademark. The local prototype uses the requested
working label only; public naming requires separate review before release.

## Original 2048

- Project: <https://github.com/gabrielecirulli/2048>
- Reviewed source commit: `478b6ec346e3787f589e4af751378d06ded4cbbc`
- Copyright: 2014 Gabriele Cirulli
- License: MIT; full text in `docs/games/licenses/2048-MIT.txt`
- Use: the Boho-native TypeScript engine adapts the original movement, merge,
  scoring, tile-spawn, win, and continue mechanics. The legacy page, analytics,
  and presentation code are not included.

## Simon Tatham's Portable Puzzle Collection

- Project: <https://www.chiark.greenend.org.uk/~sgtatham/puzzles/>
- Official source: <https://git.tartarus.org/simon/puzzles.git>
- Pinned commit: `3c3632259d298ab62aafa8a5858823569ab1af46`
- Copyright: 2004–2024 Simon Tatham and contributors
- License: MIT
- Included targets: `loopy` for Loopy, `pattern` for Nonogram, and `mines`
  for Minesweeper

The local preview distributes pinned `loopy`, `pattern`, and `mines` JavaScript
and WebAssembly build outputs beside the upstream `LICENCE`, source lock, and
SHA-256 manifest. Loopy, Nonogram, and Minesweeper use their engines through the
small Boho host. Puzzle generation, solving, input, and serialization all run in
the reader's browser.

## Mah - Mahjong Solitaire

- Project: <https://github.com/ffalt/mah>
- Reviewed source commit: `89f1ee248da0d85c7c3171db53939f2ba5f096c3`
- Copyright: 2016 ffalt
- License: MIT; full text in `docs/games/licenses/mah-MIT.txt`
- Use: reference and adaptation input for solvable-board construction and
  Mahjong Solitaire interaction behavior.

Boho's implementation is a small native TypeScript engine. It renders standard
Unicode Mahjong characters using the reader's installed system fonts. It does
not distribute Mah's Angular application, photographs, sounds, fonts, or mixed-
license artwork packs.
