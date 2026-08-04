import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("the shared game guide is accessible, repeatable, and appears once automatically", async () => {
  const guide = await source("src/components/games/GameGuide.astro");
  assert.match(guide,/<dialog[\s\S]*aria-labelledby=/);
  assert.match(guide,/aria-haspopup="dialog"/);
  assert.match(guide,/aria-label="Close instructions"/);
  assert.match(guide,/dialog\.showModal\(\)/);
  assert.match(guide,/boho-games:guide:\$\{dialog\.dataset\.gameGuideKey\}:v1/);
  assert.match(guide,/localStorage\.getItem\(key\)!=="seen"/);
  assert.match(guide,/localStorage\.setItem\(key,"seen"\)/);
  assert.match(guide,/boho-game-guide-open/);
  assert.match(guide,/boho-game-guide-close/);
});

test("Loopy, Nonogram, and Minesweeper include visual rule examples and pause while their guide is open", async () => {
  const [loopy,nonogram,minesweeper,layout,performance] = await Promise.all([
    source("src/pages/games/loopy.astro"),
    source("src/pages/games/nonogram.astro"),
    source("src/pages/games/minesweeper.astro"),
    source("src/layouts/GamesLayout.astro"),
    source("src/lib/games/performance.ts")
  ]);
  for (const page of [loopy,nonogram,minesweeper]) {
    assert.match(page,/<GameGuide/);
    assert.match(page,/<svg[\s\S]*role="img"/);
    assert.match(page,/boho-game-guide-open[\s\S]*performanceTracker\.pause\(\)/);
    assert.match(page,/boho-game-guide-close[\s\S]*performanceTracker\.resume\(\)/);
  }
  assert.match(loopy,/exactly one closed loop/i);
  assert.match(loopy,/cannot branch, stop, cross itself, or split/i);
  assert.match(nonogram,/“1 1” means two single fills/i);
  assert.match(nonogram,/space must separate two different runs/i);
  assert.match(minesweeper,/all eight neighbors/i);
  assert.match(minesweeper,/Chord satisfied numbers/i);
  assert.match(minesweeper,/flags alone do not finish the board/i);
  assert.match(layout,/\.game-guide::backdrop/);
  assert.match(layout,/\.nonogram-demo-fill/);
  assert.match(performance,/return \{[\s\S]*pause,[\s\S]*resume,/);
});
