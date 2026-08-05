import assert from "node:assert/strict";
import test from "node:test";
import {
  createFreeCellGame,
  createPyramidGame,
  createSpiderGame,
  createTriPeaksGame,
  dealSpiderStock,
  drawPyramid,
  drawTriPeaks,
  freeCellMoveCapacity,
  moveFreeCell,
  moveSpider,
  playTriPeaks,
  pyramidExposed,
  removePyramid,
  triPeaksExposed
} from "../src/lib/games/card-suite.ts";

const rng = (seed) => { let value = seed >>> 0; return () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296); };

test("FreeCell deals all 52 cards face-up into canonical 7/6 columns", () => {
  const game = createFreeCellGame(rng(11));
  assert.deepEqual(game.tableau.map((pile) => pile.length), [7,7,7,7,6,6,6,6]);
  assert.ok(game.tableau.flat().every((card) => card.faceUp));
  assert.equal(new Set(game.tableau.flat().map((card) => card.id)).size, 52);
});

test("FreeCell supermove capacity accounts for open cells and empty columns", () => {
  const game = createFreeCellGame(rng(9));
  assert.equal(freeCellMoveCapacity(game, 0), 5);
  game.tableau[7] = [];
  assert.equal(freeCellMoveCapacity(game, 0), 10);
  game.cells[0] = game.tableau[0].pop();
  assert.equal(freeCellMoveCapacity(game, 0), 8);
});

test("FreeCell moves a legal card to a cell and rejects occupied cells", () => {
  const game = createFreeCellGame(rng(4));
  const moved = moveFreeCell(game, { zone:"tableau", pile:0, index:game.tableau[0].length-1 }, { zone:"cell", index:0 });
  assert.equal(moved.moved, true);
  assert.equal(moved.state.cells[0]?.id, game.tableau[0].at(-1).id);
  assert.equal(moveFreeCell(moved.state, { zone:"tableau", pile:1, index:moved.state.tableau[1].length-1 }, { zone:"cell", index:0 }).moved, false);
});

test("Spider deals canonical 54-card tableau and 50-card stock in every mode", () => {
  for (const suits of [1,2,4]) {
    const game = createSpiderGame(rng(suits), suits);
    assert.deepEqual(game.tableau.map((pile) => pile.length), [6,6,6,6,5,5,5,5,5,5]);
    assert.equal(game.stock.length, 50);
    assert.equal(new Set([...game.stock,...game.tableau.flat()].map((card) => card.id)).size, 104);
    assert.ok(game.tableau.every((pile) => pile.at(-1).faceUp && pile.slice(0,-1).every((card) => !card.faceUp)));
  }
});

test("Spider stock deals one face-up card to each nonempty column", () => {
  const game = createSpiderGame(rng(18), 2);
  const result = dealSpiderStock(game);
  assert.equal(result.moved, true);
  assert.equal(result.state.stock.length, 40);
  assert.deepEqual(result.state.tableau.map((pile) => pile.length), [7,7,7,7,6,6,6,6,6,6]);
  const blocked = structuredClone(game); blocked.tableau[0] = [];
  assert.equal(dealSpiderStock(blocked).moved, false);
});

test("Spider moves only packed same-suit descending runs", () => {
  const game = createSpiderGame(rng(1), 1);
  game.tableau = Array.from({length:10},()=>[]);
  game.tableau[0] = [{id:"S5-a",suit:"spades",rank:5,faceUp:true},{id:"S4-a",suit:"spades",rank:4,faceUp:true}];
  game.tableau[1] = [{id:"S6-a",suit:"spades",rank:6,faceUp:true}];
  assert.equal(moveSpider(game,0,0,1).moved,true);
  game.tableau[0][1].suit="hearts";
  assert.equal(moveSpider(game,0,0,1).moved,false);
});

test("Pyramid exposes only uncovered cards and removes kings or pairs totaling 13", () => {
  const game = createPyramidGame(rng(7));
  assert.equal(pyramidExposed(game,0),false);
  assert.equal(pyramidExposed(game,27),true);
  game.tableau[27].rank=13;
  const king = removePyramid(game,{zone:"tableau",index:27});
  assert.equal(king.moved,true);
  const pairGame=createPyramidGame(rng(8)); pairGame.tableau[26].rank=5; pairGame.tableau[27].rank=8;
  assert.equal(removePyramid(pairGame,{zone:"tableau",index:26},{zone:"tableau",index:27}).moved,true);
  pairGame.tableau[27].rank=7;
  assert.equal(removePyramid(pairGame,{zone:"tableau",index:26},{zone:"tableau",index:27}).moved,false);
});

test("Pyramid stock is a single 24-card pass", () => {
  let game=createPyramidGame(rng(2));
  for(let index=0;index<24;index++) game=drawPyramid(game).state;
  assert.equal(game.stock.length,0); assert.equal(game.waste.length,24);
  assert.equal(drawPyramid(game).moved,false);
});

test("TriPeaks uses the canonical overlap graph and adjacent-rank rule without wrap", () => {
  const game=createTriPeaksGame(rng(5));
  assert.equal(triPeaksExposed(game,0),false); assert.equal(triPeaksExposed(game,18),true);
  game.waste.at(-1).rank=7; game.tableau[18].rank=8;
  assert.equal(playTriPeaks(game,18).moved,true);
  game.tableau[19].rank=10;
  assert.equal(playTriPeaks(game,19).moved,false);
  game.waste.at(-1).rank=13; game.tableau[19].rank=1;
  assert.equal(playTriPeaks(game,19).moved,false,"Ace and King do not wrap");
});

test("TriPeaks initializes one waste card and a 23-card stock", () => {
  const game=createTriPeaksGame(rng(12));
  assert.equal(game.tableau.length,28); assert.equal(game.stock.length,23); assert.equal(game.waste.length,1);
  const drawn=drawTriPeaks(game); assert.equal(drawn.moved,true); assert.equal(drawn.state.stock.length,22); assert.equal(drawn.state.streak,0);
});
