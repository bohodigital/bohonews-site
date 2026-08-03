# Boho Games third-party notices

The local Boho Games prototypes use the following permissively licensed inputs.

## Crossword Layout Generator

- Package: `crossword-layout-generator` 0.1.1
- Project: <https://github.com/MichaelWehar/Crossword-Layout-Generator>
- Copyright: 2018 Michael Wehar
- License: MIT
- Use: arranges Boho-authored answer/clue records into compact crossword layouts.

The package does not create answers or clues. Boho News owns and reviews the
answer/clue bank separately. Generated layouts are quality-gated before display.

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
- Intended targets: `pattern` for Nonogram and `mines` for Minesweeper

The repository currently distributes no Tatham code or binaries. The lock
manifest and offline build script establish a reproducible, license-checked
intake path; a later reviewed change will add the shared host and built assets.
