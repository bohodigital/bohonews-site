import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { scoreWordleGuess, WORDLE_ANSWERS } from "../src/lib/games/wordle.ts";

const page = (name) => readFile(new URL(`../src/pages/games/${name}`, import.meta.url), "utf8");

test("games remain static-first and use only device-local progress", async () => {
  const sources = await Promise.all([page("index.astro"), page("daily-word.astro"), page("mini.astro"), page("sudoku.astro")]);
  for (const source of sources) {
    assert.doesNotMatch(source, /\bfetch\s*\(/);
    assert.doesNotMatch(source, /new WebSocket|DURABLE_OBJECT|D1Database/);
  }
  assert.match(sources[0],/localStorage\.getItem\("boho-games:v2"\)/);
  assert.ok(sources.slice(1).every((source) => /STORAGE_KEY\s*=\s*"boho-games:v2"/.test(source) && source.includes("localStorage.getItem(STORAGE_KEY)")));
});

test("all three games expose keyboard and status contracts", async () => {
  const [word, mini, sudoku] = await Promise.all([page("daily-word.astro"), page("mini.astro"), page("sudoku.astro")]);
  assert.match(word, /aria-live="polite"/);
  assert.match(word, /document\.addEventListener\("keydown"/);
  assert.match(mini, /setAttribute\("aria-label",`Row \$\{row\+1\}, column/);
  assert.match(mini, /ArrowRight/);
  assert.match(sudoku, /aria-label="Nine by nine Sudoku puzzle"/);
  assert.match(sudoku, /ArrowDown/);
  for (const source of [mini, sudoku]) assert.match(source, /setAttribute\("aria-invalid","true"\)/);
});

test("Wordle scoring handles repeated letters and uses the requested hint colors", async () => {
  const word = await page("daily-word.astro");
  assert.deepEqual(scoreWordleGuess("ALLEY","APPLE"),["correct","present","absent","present","absent"]);
  assert.ok(WORDLE_ANSWERS.length >= 200);
  for (const color of ["#787c7e","#c9b458","#6aaa64"]) assert.match(word,new RegExp(color));
  assert.match(word,/allowedWordData\.words/);
});

test("crossword and Sudoku use reviewed local generators", async () => {
  const [mini,sudoku,notices] = await Promise.all([
    page("mini.astro"), page("sudoku.astro"), readFile(new URL("../docs/games/THIRD-PARTY-NOTICES.md",import.meta.url),"utf8")
  ]);
  assert.match(mini,/crossword-layout-generator/);
  assert.match(mini,/attempt<40/);
  assert.match(sudoku,/from "sudoku-gen"/);
  assert.match(notices,/quality-gated/);
  assert.match(notices,/Wordle.*trademark/s);
});

test("game pages are local mockups and excluded from indexing", async () => {
  const layout = await readFile(new URL("../src/layouts/GamesLayout.astro", import.meta.url), "utf8");
  const hub = await page("index.astro");
  assert.match(layout, /<BaseLayout[\s\S]*\bnoindex\b[\s\S]*>/);
  assert.match(hub, /Local prototype/);
  for (const route of ["daily-word", "mini", "sudoku"]) assert.match(hub, new RegExp(`/games/${route}/`));
});

test("game pages have the same focused shell and fresh theme in preview and production", async () => {
  const [layout,base,header,theme] = await Promise.all([
    readFile(new URL("../src/layouts/GamesLayout.astro",import.meta.url),"utf8"),
    readFile(new URL("../src/layouts/BaseLayout.astro",import.meta.url),"utf8"),
    readFile(new URL("../src/components/SiteHeader.astro",import.meta.url),"utf8"),
    readFile(new URL("../public/theme.js",import.meta.url),"utf8")
  ]);
  assert.match(layout,/hideMarketTicker/);
  assert.match(layout,/defaultTheme="light"/);
  assert.match(base,/!candidatePreview && !hideMarketTicker/);
  assert.match(base,/<SiteHeader hideMarketTicker=\{hideMarketTicker\}/);
  assert.match(header,/!candidatePreview && !hideMarketTicker && <MarketTicker/);
  assert.match(theme,/dataset\.themeDefault/);
  assert.match(theme,/choices\.has\(localStorage\.getItem\(key\)\) \? localStorage\.getItem\(key\) : pageDefault/);
});
