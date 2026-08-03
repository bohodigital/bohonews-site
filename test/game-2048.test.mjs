import assert from "node:assert/strict";
import test from "node:test";
import {
  canMove2048,
  create2048Grid,
  isValid2048Grid,
  max2048Tile,
  move2048,
  scoreBucket2048,
  spawn2048Tile
} from "../src/lib/games/game-2048.ts";

test("2048 spawns deterministic tiles without mutating the board", () => {
  const source = Array(16).fill(0);
  const values = [0.5, 0.95];
  const spawned = spawn2048Tile(source, () => values.shift());
  assert.equal(spawned[8], 4);
  assert.deepEqual(source, Array(16).fill(0));
  const startValues = [0, 0, 0.99, 0.5];
  const start = create2048Grid(() => startValues.shift());
  assert.equal(start.filter(Boolean).length, 2);
  assert.equal(start[0], 2);
  assert.equal(start[15], 2);
});

test("2048 moves in all four directions", () => {
  const source = [2,0,2,0, 0,0,0,0, 2,0,2,0, 0,0,0,0];
  assert.deepEqual(move2048(source,"left").grid, [4,0,0,0, 0,0,0,0, 4,0,0,0, 0,0,0,0]);
  assert.deepEqual(move2048(source,"right").grid, [0,0,0,4, 0,0,0,0, 0,0,0,4, 0,0,0,0]);
  assert.deepEqual(move2048(source,"up").grid, [4,0,4,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
  assert.deepEqual(move2048(source,"down").grid, [0,0,0,0, 0,0,0,0, 0,0,0,0, 4,0,4,0]);
});

test("2048 merges each tile once and reports score gained", () => {
  const result = move2048([2,2,2,2, ...Array(12).fill(0)], "left");
  assert.deepEqual(result.grid.slice(0,4), [4,4,0,0]);
  assert.equal(result.gained, 8);
  const chained = move2048([4,4,8,0, ...Array(12).fill(0)], "left");
  assert.deepEqual(chained.grid.slice(0,4), [8,8,0,0]);
  assert.equal(chained.gained, 8);
});

test("2048 detects wins, losses, and malformed saves", () => {
  const win = move2048([1024,1024, ...Array(14).fill(0)], "left");
  assert.equal(win.reached2048, true);
  assert.equal(max2048Tile(win.grid), 2048);
  const blocked = [2,4,2,4, 4,2,4,2, 2,4,2,4, 4,2,4,2];
  assert.equal(canMove2048(blocked), false);
  assert.equal(canMove2048([2,2,...blocked.slice(2)]), true);
  assert.equal(isValid2048Grid([...Array(15).fill(0),3]), false);
});

test("2048 aggregate score buckets stay coarse", () => {
  assert.equal(scoreBucket2048(256), "<512");
  assert.equal(scoreBucket2048(512), "512");
  assert.equal(scoreBucket2048(1024), "1024");
  assert.equal(scoreBucket2048(2048), "2048");
  assert.equal(scoreBucket2048(8192), "4096+");
});
