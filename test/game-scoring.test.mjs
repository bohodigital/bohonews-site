import assert from "node:assert/strict";
import test from "node:test";
import {
  createGameTimer, elapsedGameMs, finishGameTimer, formatGameTime, mahjongPoints,
  miniCrosswordPoints, miniPerfectSeconds, nonogramPoints, pauseGameTimer,
  pointsBucket, resumeGameTimer, sudokuPoints, wordlePoints
} from "../src/lib/games/scoring.ts";

test("game timers pause, resume, finish, and format without counting hidden time", () => {
  const timer = createGameTimer(1_000);
  assert.equal(elapsedGameMs(timer, 6_000), 5_000);
  pauseGameTimer(timer, 6_000);
  assert.equal(elapsedGameMs(timer, 20_000), 5_000);
  resumeGameTimer(timer, 20_000);
  finishGameTimer(timer, 82_345);
  assert.equal(elapsedGameMs(timer, 90_000), 67_345);
  assert.equal(formatGameTime(67_345), "1:07");
  assert.equal(formatGameTime(3_661_000), "1:01:01");
});

test("Wordle rewards fewer guesses first and faster solves second", () => {
  assert.ok(wordlePoints({ won:true, guesses:2, elapsedMs:120_000 }) > wordlePoints({ won:true, guesses:3, elapsedMs:20_000 }));
  assert.ok(wordlePoints({ won:true, guesses:3, elapsedMs:20_000 }) > wordlePoints({ won:true, guesses:3, elapsedMs:120_000 }));
  assert.equal(wordlePoints({ won:false, guesses:6, elapsedMs:10_000 }), 0);
});

test("Mini perfect time reflects lexical texture and its P/t score is asymptotic", () => {
  const plain = miniPerfectSeconds(["EASE","AREA","SEAT","EATS","EASE","AREA","SEAT","EATS"]);
  const spicy = miniPerfectSeconds(["JAZZ","QUIZ","ZANY","WAXY","JAZZ","QUIZ","ZANY","WAXY"]);
  assert.ok(spicy > plain);
  const fast = miniCrosswordPoints({ elapsedMs:10_000, perfectSeconds:spicy });
  const faster = miniCrosswordPoints({ elapsedMs:1_000, perfectSeconds:spicy });
  assert.ok(faster > fast * 5);
  assert.equal(miniCrosswordPoints({ elapsedMs:60_000, perfectSeconds:100, failedChecks:1 }), miniCrosswordPoints({ elapsedMs:60_000, perfectSeconds:100 }) - 600);
});

test("Sudoku, Mahjong, and Nonogram scores apply their game-specific factors", () => {
  assert.ok(sudokuPoints({ difficulty:"expert", elapsedMs:600_000 }) > sudokuPoints({ difficulty:"easy", elapsedMs:600_000 }));
  assert.ok(sudokuPoints({ difficulty:"hard", elapsedMs:60_000 }) > sudokuPoints({ difficulty:"hard", elapsedMs:600_000 }));
  assert.ok(mahjongPoints({ elapsedMs:300_000, hints:0 }) > mahjongPoints({ elapsedMs:300_000, hints:2 }));
  assert.ok(nonogramPoints({ rows:15, cols:15, elapsedMs:300_000 }) > nonogramPoints({ rows:10, cols:10, elapsedMs:300_000 }));
  assert.equal(nonogramPoints({ rows:15, cols:15, elapsedMs:1_000, usedSolve:true }), 0);
});

test("anonymous point buckets remain coarse", () => {
  assert.equal(pointsBucket(0), "0");
  assert.equal(pointsBucket(1), "1-1999");
  assert.equal(pointsBucket(3999), "2000-3999");
  assert.equal(pointsBucket(8000), "8000-15999");
  assert.equal(pointsBucket(16000), "16000+");
});
