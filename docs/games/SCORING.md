# Boho Games timing and scoring

Status: local preview implementation

All timing and score calculation runs in the reader's browser. The shared clock
starts with a fresh game, pauses while the document is hidden, resumes when the
reader returns, and freezes at the first terminal outcome. Existing completed
saves created before timing was added display an em dash instead of inventing a
time or score.

The optional aggregate service receives only `game`, `variant`, `outcome`, and
one coarse points band. It receives no exact score, exact duration, move log,
hint log, player identifier, device identifier, IP-derived field, or user-agent
field. Rendering, ticking, and scoring consume no Cloudflare Worker CPU.

## Formulae

Let `t` be active elapsed seconds. Executable formulae use a one-millisecond
floor to avoid division by zero.

- Wordle: a win earns `7000 - 1000 * guesses`, plus
  `2000 * 120 / (120 + t)`. A loss scores zero. Guess count therefore dominates
  speed, matching the game's familiar result distribution.
- Mini Crossword: the calculated perfect time `P` is `20 + 2 * cells +
  5 * clues + 1.5 * rare-letter weight`. Score is
  `4000 + 4000 * P / t - 600 * failed checks`. The `P/t` term is intentionally
  asymptotic and has no mathematical ceiling as `t` approaches zero.
- Sudoku: each difficulty supplies a base, par time, and failed-check penalty.
  Score is `base + base * par / (par + t) - penalty * failed checks`.
  Easy uses 2,500/360/250; Medium 4,000/600/400; Hard 6,000/900/600; Expert
  8,500/1,200/850.
- 2048: points remain the canonical sum of the values created by merges. The
  clock is context only and never penalizes deliberate strategy.
- Nonogram: for board area `A`, score is
  `40A + 40A * 2A / (2A + t)`. Using the upstream Solve command scores zero.
- Minesweeper: a clean clear earns `base + base * par / (par + t)`.
  Beginner uses 2,500/60, Intermediate 6,500/240, and Expert 12,000/480.
  Custom boards derive a bounded base from safe squares and mines and use
  0.9 seconds per safe square as par. Hitting a mine or restarting the known
  layout makes that attempt practice-only and scores zero.
- Connections: a solve earns `7000 + 3000 * 180 / (180 + t) - 900 * mistakes`.
  Shuffle and deselect are free. A loss after four mistakes scores zero.
- Mahjong Solitaire: clearing the Turtle earns `7200 + 7200 * 600 / (600 + t)
  - 500 * hints`. Undo has no penalty.

Anonymous point bands are `0`, `1-1999`, `2000-3999`, `4000-7999`,
`8000-15999`, and `16000+`.

## Convention references

- The New York Times Mini documents an on-puzzle timer, pause-on-leave behavior,
  time statistics, and Check/Reveal assistance:
  https://nytimes.zendesk.com/hc/en-us/articles/360025912452-The-Mini-Crossword
- The New York Times Games app describes Wordle comparison by number of guesses
  and Mini comparison by completion time:
  https://thenewyorktimeshelpcenter.helpjuice.com/360052273251-The-New-York-Times-Games-app
- The original open-source 2048 implementation is the authority for awarding
  the value of each merged tile:
  https://github.com/gabrielecirulli/2048
- Brainium Sudoku documents difficulty-specific par times and mistake
  penalties:
  https://brainium.helpshift.com/hc/en/7-sudoku/faq/485-what-are-the-sudoku-rules/
- Arkadium's Mahjong Solitaire help uses suit, chain, remaining-tile, and bonus
  components. Boho deliberately uses a simpler completion/time/hint model:
  https://support.arkadium.com/en/support/solutions/articles/44002182015--mahjong-solitaire-how-to-play-tips-blank-tiles-scoring
- Nonogram remains the pinned Pattern engine from Simon Tatham's Portable Puzzle
  Collection:
  https://www.chiark.greenend.org.uk/~sgtatham/puzzles/
- Minesweeper remains the pinned Mines engine. Its official rules document safe
  first reveals, eight-neighbor counts, flags, chording, and deduction-only
  generation:
  https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/mines.html
- Connections uses original Boho-authored rounds and the familiar four-groups,
  four-mistakes convention. No third-party puzzle archive or answer text ships.
