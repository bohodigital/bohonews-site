import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { scoreWordleGuess, WORDLE_ANSWERS } from "../src/lib/games/wordle.ts";

const page = (name) => readFile(new URL(`../src/pages/games/${name}`, import.meta.url), "utf8");

test("games remain static-first and keep puzzle state device-local", async () => {
  const sources = await Promise.all([page("index.astro"), page("daily-word.astro"), page("mini.astro"), page("sudoku.astro"), page("2048.astro"), page("nonogram.astro"), page("mahjong.astro"), page("loopy.astro")]);
  for (const source of sources) {
    assert.doesNotMatch(source, /new WebSocket|DURABLE_OBJECT|D1Database/);
  }
  assert.match(sources[0],/localStorage\.getItem\("boho-games:v2"\)/);
  assert.ok(sources.slice(1,5).every((source) => /STORAGE_KEY\s*=\s*"boho-games:v2"/.test(source) && source.includes("localStorage.getItem(STORAGE_KEY)")));
  assert.match(sources[6],/STORAGE_KEY="boho-games:v2"/);
  assert.match(sources[7],/STORAGE_KEY="boho-games:v2"/);
});

test("games hub reads completion from the current saved round", async () => {
  const hub = await page("index.astro");
  assert.match(hub, /progress\[key\]\?\.current\?\.complete/);
});

test("completed games submit only coarse optional point buckets", async () => {
  const [layout, word, mini, sudoku, twenty48, nonogram, mahjong, loopy, client] = await Promise.all([
    readFile(new URL("../src/layouts/GamesLayout.astro", import.meta.url), "utf8"),
    page("daily-word.astro"), page("mini.astro"), page("sudoku.astro"), page("2048.astro"), page("nonogram.astro"), page("mahjong.astro"), page("loopy.astro"),
    readFile(new URL("../public/game-stats.js", import.meta.url), "utf8")
  ]);
  assert.match(layout, /data-game-stats-opt-in/);
  assert.match(layout, /off by default/i);
  assert.match(client, /const API = "\/api\/games\/v1"/);
  assert.match(client, /`\$\{API\}\/completions`/);
  assert.match(word, /game:"wordle"[\s\S]*scoreBucket/);
  assert.match(mini, /game:"mini"[\s\S]*scoreBucket:pointsBucket/);
  assert.match(sudoku, /game:"sudoku"[\s\S]*variant:state\.difficulty/);
  assert.match(twenty48, /game:"2048"[\s\S]*scoreBucket:pointsBucket/);
  assert.match(nonogram, /game:"nonogram"[\s\S]*variant:"pattern"[\s\S]*scoreBucket:pointsBucket/);
  assert.match(mahjong, /game:"mahjong"[\s\S]*variant:"turtle"[\s\S]*scoreBucket:pointsBucket/);
  assert.match(loopy, /game:"loopy"[\s\S]*scoreBucket:pointsBucket/);
  for (const source of [word, mini, sudoku, twenty48, nonogram, mahjong, loopy]) assert.doesNotMatch(source, /playerId|deviceId|userAgent|location/);
});

test("every game exposes the shared timer and transparent scoring rules", async () => {
  const sources = await Promise.all([page("daily-word.astro"), page("mini.astro"), page("sudoku.astro"), page("2048.astro"), page("nonogram.astro"), page("mahjong.astro"), page("loopy.astro")]);
  for (const source of sources) {
    assert.match(source, /data-game-time|GamePerformance/);
    assert.match(source, /How scoring works|rules=/);
    assert.match(source, /attachGamePerformance/);
  }
});

test("saved game guards reject malformed state and completed grids cannot be edited", async () => {
  const [word, mini, sudoku] = await Promise.all([page("daily-word.astro"), page("mini.astro"), page("sudoku.astro")]);
  for (const source of [word, mini, sudoku]) assert.match(source, /function validState/);
  assert.match(mini, /input\.disabled=state\.complete/);
  assert.match(sudoku, /if\(state\.complete\|\|selected<0/);
  assert.match(sudoku, /selected%9<8/);
  assert.match(sudoku, /selected%9>0/);
});

test("all seven games expose keyboard and status contracts", async () => {
  const [word, mini, sudoku, twenty48, mahjong, loopy] = await Promise.all([page("daily-word.astro"), page("mini.astro"), page("sudoku.astro"), page("2048.astro"), page("mahjong.astro"), page("loopy.astro")]);
  assert.match(word, /aria-live="polite"/);
  assert.match(word, /document\.addEventListener\("keydown"/);
  assert.match(mini, /setAttribute\("aria-label",`Row \$\{row\+1\}, column/);
  assert.match(mini, /ArrowRight/);
  assert.match(sudoku, /aria-label="Nine by nine Sudoku puzzle"/);
  assert.match(sudoku, /ArrowDown/);
  assert.match(twenty48, /aria-label="Four by four 2048 board"/);
  assert.match(twenty48, /ArrowUp/);
  assert.match(twenty48, /pointerdown/);
  assert.match(mahjong, /role="status" aria-live="polite"/);
  assert.match(mahjong, /button\.type="button"/);
  assert.match(mahjong, /aria-label.*free.*blocked/);
  assert.match(loopy, /TathamPuzzleHost/);
  assert.match(loopy, /Ctrl-click/);
  const nonogram = await page("nonogram.astro");
  assert.match(nonogram, /TathamPuzzleHost/);
  assert.match(nonogram, /Keyboard controls/);
  for (const source of [mini, sudoku]) assert.match(source, /setAttribute\("aria-invalid","true"\)/);
});

test("Mini Crossword follows familiar active-clue navigation", async () => {
  const [mini,layout] = await Promise.all([
    page("mini.astro"),
    readFile(new URL("../src/layouts/GamesLayout.astro",import.meta.url),"utf8")
  ]);
  assert.match(mini,/let selectedIndex=-1; let direction="across"/);
  assert.match(mini,/event\.key==="Enter"\|\|event\.key==="Tab"/);
  assert.match(mini,/event\.key===" "&&entriesForCell/);
  assert.match(mini,/directionHint:event\.key==="ArrowRight"/);
  assert.match(mini,/moveWithinEntry\(-1\)/);
  assert.match(mini,/moveWithinEntry\(1,\{skipFilled:true\}\)/);
  assert.doesNotMatch(mini,/if\(input\.value&&!moveWithinEntry\(1\)\)cycleClue/);
  assert.match(mini,/return state\.entries\[cursor\]!=="-"\?cursor:null/);
  assert.match(mini,/data-mini-current-clue/);
  assert.match(mini,/toggleAttribute\("aria-current"/);
  assert.match(layout,/\.mini-cell\[data-in-word\]/);
  assert.match(layout,/\.mini-clues button\[aria-current\]/);
});

test("Wordle scoring handles repeated letters and uses the requested hint colors", async () => {
  const word = await page("daily-word.astro");
  const layout = await readFile(new URL("../src/layouts/GamesLayout.astro", import.meta.url), "utf8");
  assert.deepEqual(scoreWordleGuess("ALLEY","APPLE"),["correct","present","absent","present","absent"]);
  assert.ok(WORDLE_ANSWERS.length >= 200);
  for (const color of ["#787c7e","#c9b458","#6aaa64"]) assert.match(layout,new RegExp(color));
  assert.match(word,/allowedWordData\.words/);
});

test("game route styles survive the governed publisher as an external asset", async () => {
  const [layout, word, mini, sudoku, twenty48, nonogram, mahjong, loopy] = await Promise.all([
    readFile(new URL("../src/layouts/GamesLayout.astro", import.meta.url), "utf8"),
    page("daily-word.astro"), page("mini.astro"), page("sudoku.astro"), page("2048.astro"), page("nonogram.astro"), page("mahjong.astro"), page("loopy.astro")
  ]);
  for (const selector of [".word-board", ".mini-grid", ".sudoku-grid", ".twenty48-grid", ".tatham-host", ".mahjong-board", ".game-card__motif--loopy"]) assert.match(layout, new RegExp(selector.replace(".", "\\.")));
  for (const source of [word, mini, sudoku, twenty48, nonogram, mahjong, loopy]) assert.doesNotMatch(source, /<style\b/);
});

test("crossword and Sudoku use reviewed local generators", async () => {
  const [mini,sudoku,notices] = await Promise.all([
    page("mini.astro"), page("sudoku.astro"), readFile(new URL("../docs/games/THIRD-PARTY-NOTICES.md",import.meta.url),"utf8")
  ]);
  assert.match(mini,/MINI4_PUZZLES/);
  assert.match(mini,/mini4ToLayout/);
  assert.doesNotMatch(mini,/crossword-layout-generator|attempt<40/);
  assert.match(sudoku,/from "sudoku-gen"/);
  assert.match(notices,/quality-gated/);
  assert.match(notices,/Wordle.*trademark/s);
});

test("game pages are local mockups and excluded from indexing", async () => {
  const layout = await readFile(new URL("../src/layouts/GamesLayout.astro", import.meta.url), "utf8");
  const hub = await page("index.astro");
  assert.match(layout, /<BaseLayout[\s\S]*\bnoindex\b[\s\S]*>/);
  assert.match(hub, /Local prototype/);
  for (const route of ["daily-word", "mini", "sudoku", "2048", "nonogram", "mahjong", "loopy"]) assert.match(hub, new RegExp(`/games/${route}/`));
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
