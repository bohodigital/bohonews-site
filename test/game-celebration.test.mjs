import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("every game shares an accessible reduced-motion celebration", async () => {
  const gamePages = ["daily-word", "mini", "sudoku", "2048", "nonogram", "mahjong", "loopy", "minesweeper", "connections", "solitaire"];
  const [helper, layout, suite, ...pages] = await Promise.all([
    readFile(new URL("../src/lib/games/celebration.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/layouts/GamesLayout.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/components/games/CardSuiteGame.astro", import.meta.url), "utf8"),
    ...gamePages.map((page) => readFile(new URL(`../src/pages/games/${page}.astro`, import.meta.url), "utf8"))
  ]);
  assert.match(helper, /role", "dialog"/);
  assert.match(helper, /aria-labelledby/);
  assert.match(helper, /42/);
  assert.match(layout, /@keyframes game-confetti/);
  assert.match(layout, /prefers-reduced-motion: reduce/);
  assert.match(suite, /showGameCelebration/);
  pages.forEach((source, index) => assert.match(source, /showGameCelebration/, `${gamePages[index]} should celebrate a win`));
});

test("assistive solves, practice clears, and losses do not celebrate", async () => {
  const [nonogram, loopy, minesweeper, connections, twenty48] = await Promise.all([
    readFile(new URL("../src/pages/games/nonogram.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/games/loopy.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/games/minesweeper.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/games/connections.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/games/2048.astro", import.meta.url), "utf8")
  ]);
  assert.match(nonogram, /if\(!state\.usedSolve\)showGameCelebration/);
  assert.match(loopy, /if\(!state\.usedSolve\)showGameCelebration/);
  assert.match(minesweeper, /if\(!state\.failed&&!state\.practice\).*showGameCelebration/);
  assert.match(connections, /if\(won\)showGameCelebration/);
  assert.match(twenty48, /if\(outcome==="won"\)showGameCelebration/);
});
