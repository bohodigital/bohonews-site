import assert from "node:assert/strict";
import test from "node:test";
import { availableMahjongPairs, createMahjongGame, freeMahjongTileIds, isMahjongDeadlocked, isValidMahjongGame, mahjongHint, mahjongSeed, removeMahjongPair, turtleLayout, undoMahjongPair } from "../src/lib/games/mahjong.ts";

test("Turtle is the canonical 144-tile five-level layout",()=>{
  const layout=turtleLayout();assert.equal(layout.length,144);assert.equal(new Set(layout.map(({id})=>id)).size,144);assert.deepEqual([...new Set(layout.map(({z})=>z))],[0,1,2,3,4]);
  assert.deepEqual([0,1,2,3,4].map((z)=>layout.filter((tile)=>tile.z===z).length),[87,36,16,4,1]);
  assert.equal(mahjongSeed("boho"),mahjongSeed("boho"));assert.notEqual(mahjongSeed("boho"),mahjongSeed("news"));
});

test("seeded Mahjong deals are valid, stable, and different across seeds",()=>{
  const first=createMahjongGame("one");const repeated=createMahjongGame("one");const other=createMahjongGame("two");
  assert.equal(first.tiles.length,144);assert.equal(JSON.stringify(first),JSON.stringify(repeated));assert.notEqual(first.tiles.map(({face})=>face).join(""),other.tiles.map(({face})=>face).join(""));assert.equal(isValidMahjongGame(first),true);
});

test("the tile set and exposed-tile rules match Mahjong Solitaire",()=>{
  const game=createMahjongGame(123);const groups=new Map();game.tiles.forEach((tile)=>groups.set(tile.group,[...(groups.get(tile.group)||[]),tile]));const regular=[...groups].filter(([group])=>group.startsWith("regular-"));
  assert.equal(regular.length,34);assert.equal(regular.every(([,tiles])=>tiles.length===4),true);assert.equal(groups.get("flowers").length,4);assert.equal(groups.get("seasons").length,4);
  const free=new Set(freeMahjongTileIds(game));
  assert.equal(free.has("4-13-7"),true,"the single crown tile is open");assert.equal(free.has("3-12-6"),false,"a tile partially underneath the crown is covered");assert.equal(free.has("2-12-6"),false,"a tile underneath the upper platform is covered");assert.equal(free.has("0-0-7"),true,"the turtle tail is open");assert.equal(free.has("0-28-7"),true,"the outermost head tile is open");
});

test("flowers match flowers, seasons match seasons, and the two families never cross-match",()=>{
  const specialState=(groups)=>{const game=createMahjongGame(321);game.tiles.forEach((tile)=>{tile.removed=!groups.includes(tile.group);});game.complete=false;return game;};
  const flowers=specialState(["flowers"]);assert.ok(availableMahjongPairs(flowers).length);assert.equal(isMahjongDeadlocked(flowers),false);
  const seasons=specialState(["seasons"]);assert.ok(availableMahjongPairs(seasons).length);assert.equal(isMahjongDeadlocked(seasons),false);
  const mixed=createMahjongGame(321);let keptFlower=false;let keptSeason=false;mixed.tiles.forEach((tile)=>{const keep=tile.group==="flowers"&&!keptFlower||tile.group==="seasons"&&!keptSeason;if(keep){if(tile.group==="flowers")keptFlower=true;else keptSeason=true;}tile.removed=!keep;});mixed.complete=false;
  assert.equal(availableMahjongPairs(mixed).length,0);assert.equal(isMahjongDeadlocked(mixed),true);
});

test("generated boards can be solved through available matching pairs",()=>{
  for(const seed of [1,2,3,4,5,99,2026]){const game=createMahjongGame(seed);let moves=0;while(!game.complete){const pair=mahjongHint(game);assert.ok(pair,`seed ${seed} deadlocked after ${moves} moves`);assert.equal(removeMahjongPair(game,...pair),true);moves++;assert.ok(moves<=72);}assert.equal(moves,72);assert.equal(freeMahjongTileIds(game).length,0);assert.equal(isValidMahjongGame(game),true);}
});

test("mismatches are rejected and undo restores the last pair",()=>{
  const game=createMahjongGame(42);const free=freeMahjongTileIds(game).map((id)=>game.tiles.find((tile)=>tile.id===id));const mismatch=free.find((tile)=>tile.group!==free[0].group);
  assert.equal(removeMahjongPair(game,free[0].id,mismatch.id),false);const pair=mahjongHint(game);assert.ok(pair);assert.equal(removeMahjongPair(game,...pair),true);assert.equal(game.history.length,1);assert.equal(undoMahjongPair(game),true);assert.equal(game.history.length,0);assert.equal(game.tiles.every(({removed})=>!removed),true);
});

test("saved games reject altered deals, coordinates, solutions, and illegal histories",()=>{
  const original=createMahjongGame(456);const alteredFace=structuredClone(original);alteredFace.tiles[0].group="flowers";assert.equal(isValidMahjongGame(alteredFace),false);
  const alteredPosition=structuredClone(original);alteredPosition.tiles[0].x=99;assert.equal(isValidMahjongGame(alteredPosition),false);
  const alteredSolution=structuredClone(original);alteredSolution.solution[0].reverse();assert.equal(isValidMahjongGame(alteredSolution),false);
  const illegalHistory=structuredClone(original);const blocked=illegalHistory.tiles.filter((tile)=>!freeMahjongTileIds(illegalHistory).includes(tile.id));const sameGroup=blocked.find((tile,index)=>blocked.some((other,otherIndex)=>otherIndex>index&&other.group===tile.group));assert.ok(sameGroup);const partner=blocked.find((tile)=>tile.id!==sameGroup.id&&tile.group===sameGroup.group);assert.ok(partner);illegalHistory.history=[[sameGroup.id,partner.id]];sameGroup.removed=true;partner.removed=true;assert.equal(isValidMahjongGame(illegalHistory),false);
});
