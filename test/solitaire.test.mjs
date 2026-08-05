import assert from "node:assert/strict";
import test from "node:test";
import {
  KLONDIKE_SUITS,
  canPlaceKlondikeFoundation,
  canPlaceKlondikeTableau,
  createKlondikeGame,
  drawKlondike,
  isValidKlondikeState,
  klondikeDeck,
  klondikeHint,
  moveKlondike
} from "../src/lib/games/solitaire.ts";

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296);
}

const byId = () => new Map(klondikeDeck().map((card) => [card.id, card]));

function customState({ tableau = [[],[],[],[],[],[],[]], waste = [], foundations = {} } = {}) {
  const cards = byId();
  const take = (id, faceUp = true) => ({ ...cards.get(id), faceUp, consumed: cards.delete(id) });
  const shapedTableau = tableau.map((pile) => pile.map(([id,faceUp=true]) => take(id,faceUp)));
  const shapedWaste = waste.map((id) => take(id,true));
  const shapedFoundations = Object.fromEntries(KLONDIKE_SUITS.map((suit) => [suit,(foundations[suit]||[]).map((id)=>take(id,true))]));
  const stock = [...cards.values()].map((card) => ({ ...card, faceUp:false }));
  for (const pile of [...shapedTableau,shapedWaste,...Object.values(shapedFoundations),stock]) for (const card of pile) delete card.consumed;
  return { stock, waste:shapedWaste, foundations:shapedFoundations, tableau:shapedTableau, drawCount:1, score:0, moves:0, recycles:0, complete:false };
}

test("Klondike deals the canonical 1–7 tableau and a 24-card stock", () => {
  const game = createKlondikeGame(() => 0.314159,1);
  assert.deepEqual(game.tableau.map((pile)=>pile.length),[1,2,3,4,5,6,7]);
  assert.equal(game.stock.length,24);
  assert.ok(game.tableau.every((pile)=>pile.filter((card)=>card.faceUp).length===1 && pile.at(-1).faceUp));
  assert.equal(isValidKlondikeState(game),true);
});

test("deals use a real shuffle rather than a patterned foundation order", () => {
  for (const seed of [3, 29, 818]) {
    const game = createKlondikeGame(seededRandom(seed), 1);
    const dealt = [...game.tableau.flat(), ...game.stock];
    assert.equal(new Set(dealt.map((card) => card.id)).size, 52);
    assert.notDeepEqual(dealt.map((card) => card.id), klondikeDeck().map((card) => card.id));
    assert.ok(game.tableau.map((pile) => pile.at(-1).rank).some((rank) => rank >= 9), `seed ${seed} exposed only foundation-order cards`);
  }
});

test("Klondike enforces alternating descending tableau and same-suit foundations", () => {
  const cards=byId();
  const blackSeven={...cards.get("C7"),faceUp:true};
  const redSix={...cards.get("H6"),faceUp:true};
  const blackSix={...cards.get("S6"),faceUp:true};
  const ace={...cards.get("H1"),faceUp:true};
  assert.equal(canPlaceKlondikeTableau(redSix,blackSeven),true);
  assert.equal(canPlaceKlondikeTableau(blackSix,blackSeven),false);
  assert.equal(canPlaceKlondikeTableau({...cards.get("D13"),faceUp:true},undefined),true);
  assert.equal(canPlaceKlondikeFoundation(ace,[],"hearts"),true);
  assert.equal(canPlaceKlondikeFoundation(redSix,[],"hearts"),false);
});

test("moving a tableau stack flips the newly exposed card and scores the reveal", () => {
  const game=customState({tableau:[[["S2",false],["H6",true]],[["C7",true]],[],[],[],[],[]]});
  assert.equal(isValidKlondikeState(game),true);
  const result=moveKlondike(game,{zone:"tableau",pile:0,index:1},{zone:"tableau",pile:1});
  assert.equal(result.moved,true);
  assert.equal(result.flipped,true);
  assert.equal(result.state.tableau[0].at(-1).faceUp,true);
  assert.deepEqual(result.state.tableau[1].slice(-2).map((card)=>card.id),["C7","H6"]);
  assert.equal(result.state.score,5);
  assert.equal(game.tableau[0][0].faceUp,false,"moves do not mutate the prior state");
});

test("stock drawing and recycling preserve all cards in draw-three play", () => {
  let game=createKlondikeGame(()=>0.2718,3);
  while(game.stock.length) game=drawKlondike(game).state;
  assert.equal(game.waste.length,24);
  const recycled=drawKlondike(game).state;
  assert.equal(recycled.stock.length,24);
  assert.equal(recycled.waste.length,0);
  assert.equal(recycled.recycles,1);
  assert.equal(isValidKlondikeState(recycled),true);
});

test("foundation completion wins and malformed duplicate saves are rejected", () => {
  const foundations=Object.fromEntries(KLONDIKE_SUITS.map((suit)=>[suit,Array.from({length:suit==="clubs"?12:13},(_,index)=>`${suit[0].toUpperCase()}${index+1}`)]));
  // Spades use S; the other suit initials are already unique.
  foundations.spades=Array.from({length:13},(_,index)=>`S${index+1}`);
  const game=customState({waste:["C13"],foundations});
  assert.equal(isValidKlondikeState(game),true);
  const won=moveKlondike(game,{zone:"waste"},{zone:"foundation",suit:"clubs"}).state;
  assert.equal(won.complete,true);
  assert.equal(won.foundations.clubs.length,13);
  const broken={...won,stock:[...won.stock,{...won.foundations.clubs[0],faceUp:false}]};
  assert.equal(isValidKlondikeState(broken),false);
});

test("hints always describe a currently legal action", () => {
  const game=customState({waste:["H1"]});
  const hint=klondikeHint(game);
  assert.deepEqual(hint,{source:{zone:"waste"},target:{zone:"foundation",suit:"hearts"}});
  assert.equal(moveKlondike(game,hint.source,hint.target).moved,true);
});
