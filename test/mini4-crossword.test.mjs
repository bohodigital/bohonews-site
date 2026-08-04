import assert from "node:assert/strict";
import test from "node:test";
import { expectedMini4Entries, mini4ToLayout, solveMini4Fills, validateMini4Puzzle } from "../src/lib/games/crossword-mini4.ts";
import { MINI4_CLUES, MINI4_PUZZLES } from "../src/lib/games/crossword-mini4-pack.ts";

test("the initial Mini Crossword pack contains 30 valid distinct 4x4 puzzles", () => {
  assert.equal(MINI4_PUZZLES.length,30);
  assert.equal(new Set(MINI4_PUZZLES.map((puzzle)=>puzzle.id)).size,30);
  assert.equal(new Set(MINI4_PUZZLES.map((puzzle)=>puzzle.grid)).size,30);
  assert.equal(new Set(MINI4_PUZZLES.map((puzzle)=>puzzle.fingerprint)).size,30);
  for(const puzzle of MINI4_PUZZLES){
    assert.deepEqual(validateMini4Puzzle(puzzle),[]);
    assert.equal(puzzle.grid.length,16);
    assert.equal(puzzle.entries.length,8);
    assert.equal(new Set(puzzle.entries.map((entry)=>entry.answer)).size,8);
  }
});

test("the pack includes a deliberate hard and playful tier", () => {
  const answers=new Set(MINI4_PUZZLES.flatMap((puzzle)=>puzzle.entries.map((entry)=>entry.answer)));
  for(const answer of ["LMAO","MAYA","ARYA","COZY","ZEUS","HALO","HELA","OGRE","NERO","DOPE","EYRE"])assert.ok(answers.has(answer),`missing personality answer ${answer}`);
  assert.ok(MINI4_PUZZLES.filter((puzzle)=>puzzle.difficulty==="hard").length>=5);
  assert.match(MINI4_CLUES.what,/Abbott and Costello/);
  assert.match(MINI4_CLUES.okay,/ominous/);
});

test("4x4 numbering and browser layout are derived from the canonical grid", () => {
  const puzzle=MINI4_PUZZLES[0];
  assert.deepEqual(expectedMini4Entries(puzzle.grid).map(({number,direction})=>[number,direction]),[
    [1,"across"],[5,"across"],[6,"across"],[7,"across"],[1,"down"],[2,"down"],[3,"down"],[4,"down"]
  ]);
  const layout=mini4ToLayout(puzzle);
  assert.equal(layout.rows,4);assert.equal(layout.cols,4);assert.equal(layout.table.flat().join(""),puzzle.grid.toLowerCase());
  assert.deepEqual(layout.result.map(({position,orientation,startx,starty})=>[position,orientation,startx,starty]),[
    [1,"across",1,1],[5,"across",1,2],[6,"across",1,3],[7,"across",1,4],
    [1,"down",1,1],[2,"down",2,1],[3,"down",3,1],[4,"down",4,1]
  ]);
});

test("the deterministic solver finds a double word square from reviewed words", () => {
  const puzzle=MINI4_PUZZLES[0];
  const vocabulary=puzzle.entries.map((entry)=>entry.answer.toLowerCase());
  const fills=solveMini4Fills(vocabulary,10);
  assert.ok(fills.some((rows)=>rows.join("").toUpperCase()===puzzle.grid));
  assert.ok(Object.keys(MINI4_CLUES).length>=100);
});

test("the validator rejects duplicate answers, bad crossings, and missing clues", () => {
  const puzzle=structuredClone(MINI4_PUZZLES[0]);
  puzzle.entries[4].answer=puzzle.entries[0].answer;
  puzzle.entries[4].clue="";
  const errors=validateMini4Puzzle(puzzle);
  assert.ok(errors.some((error)=>/distinct/.test(error)));
  assert.ok(errors.some((error)=>/Wrong answer/.test(error)));
  assert.ok(errors.some((error)=>/Invalid clue/.test(error)));
});
