import {
  KLONDIKE_SUITS,
  canPlaceKlondikeFoundation,
  klondikeCardColor,
  klondikeDeck,
  shuffleKlondikeDeck,
  type KlondikeCard,
  type KlondikeSuit
} from "./solitaire.ts";

export type Card = KlondikeCard;
export type Suit = KlondikeSuit;
export type Foundations = Record<Suit, Card[]>;

const emptyFoundations = (): Foundations => ({ clubs: [], diamonds: [], hearts: [], spades: [] });
const cloneCard = (card: Card): Card => ({ ...card });
const foundationsClone = (foundations: Foundations): Foundations => Object.fromEntries(
  KLONDIKE_SUITS.map((suit) => [suit, foundations[suit].map(cloneCard)])
) as Foundations;

export type FreeCellSource = { zone: "tableau"; pile: number; index: number } | { zone: "cell"; index: number } | { zone: "foundation"; suit: Suit };
export type FreeCellTarget = { zone: "tableau"; pile: number } | { zone: "cell"; index: number } | { zone: "foundation"; suit: Suit };
export interface FreeCellState { tableau: Card[][]; cells: Array<Card | null>; foundations: Foundations; moves: number; score: number; complete: boolean; }

export function createFreeCellGame(random: () => number = Math.random): FreeCellState {
  const deck = shuffleKlondikeDeck(klondikeDeck(), random).map((card) => ({ ...card, faceUp: true }));
  const tableau = Array.from({ length: 8 }, () => [] as Card[]);
  deck.forEach((card, index) => tableau[index % 8].push(card));
  return { tableau, cells: [null, null, null, null], foundations: emptyFoundations(), moves: 0, score: 0, complete: false };
}

export function freeCellMoveCapacity(state: FreeCellState, destinationPile: number): number {
  const emptyCells = state.cells.filter((card) => !card).length;
  const emptyColumns = state.tableau.filter((pile, index) => !pile.length && index !== destinationPile).length;
  return (emptyCells + 1) * (2 ** emptyColumns);
}

function validFreeCellRun(cards: Card[]): boolean {
  return cards.length > 0 && cards.slice(1).every((card, index) => card.rank === cards[index].rank - 1 && klondikeCardColor(card) !== klondikeCardColor(cards[index]));
}

export function moveFreeCell(state: FreeCellState, source: FreeCellSource, target: FreeCellTarget): { state: FreeCellState; moved: boolean } {
  if (state.complete) return { state, moved: false };
  let moving: Card[] = [];
  if (source.zone === "tableau") moving = state.tableau[source.pile]?.slice(source.index) || [];
  else if (source.zone === "cell") { const card = state.cells[source.index]; if (card) moving = [card]; }
  else { const card = state.foundations[source.suit]?.at(-1); if (card) moving = [card]; }
  if (!validFreeCellRun(moving)) return { state, moved: false };
  if (target.zone !== "tableau" && moving.length !== 1) return { state, moved: false };
  if (target.zone === "cell" && state.cells[target.index]) return { state, moved: false };
  if (target.zone === "foundation" && !canPlaceKlondikeFoundation(moving[0], state.foundations[target.suit], target.suit)) return { state, moved: false };
  if (target.zone === "tableau") {
    if (source.zone === "tableau" && source.pile === target.pile) return { state, moved: false };
    const destination = state.tableau[target.pile];
    if (!destination || moving.length > freeCellMoveCapacity(state, target.pile)) return { state, moved: false };
    const top = destination.at(-1);
    if (top && (top.rank !== moving[0].rank + 1 || klondikeCardColor(top) === klondikeCardColor(moving[0]))) return { state, moved: false };
  }
  const next: FreeCellState = { ...state, tableau: state.tableau.map((pile) => pile.map(cloneCard)), cells: state.cells.map((card) => card ? cloneCard(card) : null), foundations: foundationsClone(state.foundations) };
  if (source.zone === "tableau") next.tableau[source.pile].splice(source.index, moving.length);
  else if (source.zone === "cell") next.cells[source.index] = null;
  else next.foundations[source.suit].pop();
  const cards = moving.map(cloneCard);
  if (target.zone === "tableau") next.tableau[target.pile].push(...cards);
  else if (target.zone === "cell") next.cells[target.index] = cards[0];
  else next.foundations[target.suit].push(cards[0]);
  next.moves++;
  next.score = Math.max(0, next.score + (target.zone === "foundation" ? 10 : source.zone === "foundation" ? -10 : 1));
  next.complete = KLONDIKE_SUITS.every((suit) => next.foundations[suit].length === 13);
  return { state: next, moved: true };
}

export function freeCellHint(state: FreeCellState): { source: FreeCellSource; target: FreeCellTarget } | null {
  const sources: FreeCellSource[] = [
    ...state.cells.map((_, index) => ({ zone: "cell" as const, index })),
    ...state.tableau.flatMap((pile, pileIndex) => pile.map((_, index) => ({ zone: "tableau" as const, pile: pileIndex, index })))
  ];
  for (const source of sources) {
    const card = source.zone === "cell" ? state.cells[source.index] : source.zone === "tableau" ? state.tableau[source.pile]?.[source.index] : state.foundations[source.suit].at(-1);
    if (card && moveFreeCell(state, source, { zone: "foundation", suit: card.suit }).moved) return { source, target: { zone: "foundation", suit: card.suit } };
  }
  for (const source of sources) for (let pile = 0; pile < 8; pile++) if (moveFreeCell(state, source, { zone: "tableau", pile }).moved) return { source, target: { zone: "tableau", pile } };
  for (const source of sources) for (let index = 0; index < 4; index++) if (moveFreeCell(state, source, { zone: "cell", index }).moved) return { source, target: { zone: "cell", index } };
  return null;
}

export type SpiderSuitCount = 1 | 2 | 4;
export interface SpiderState { tableau: Card[][]; stock: Card[]; completed: Card[][]; suitCount: SpiderSuitCount; moves: number; score: number; complete: boolean; }

function spiderDeck(suitCount: SpiderSuitCount): Card[] {
  const suits: Suit[] = suitCount === 1 ? ["spades"] : suitCount === 2 ? ["spades", "hearts"] : [...KLONDIKE_SUITS];
  const copies = 8 / suits.length;
  return suits.flatMap((suit) => Array.from({ length: copies }, (_, copy) => Array.from({ length: 13 }, (_, index) => ({
    id: `${suit[0].toUpperCase()}${index + 1}-${copy}`,
    suit,
    rank: index + 1,
    faceUp: false
  })))).flat();
}

function shuffleCards(cards: Card[], random: () => number): Card[] {
  const values = cards.map(cloneCard);
  for (let index = values.length - 1; index > 0; index--) {
    const value = random(); const safe = Number.isFinite(value) ? Math.max(0, Math.min(.999999999, value)) : 0;
    const swap = Math.floor(safe * (index + 1)); [values[index], values[swap]] = [values[swap], values[index]];
  }
  return values;
}

export function createSpiderGame(random: () => number = Math.random, suitCount: SpiderSuitCount = 1): SpiderState {
  if (![1, 2, 4].includes(suitCount)) throw new TypeError("Spider uses one, two, or four suits");
  const deck = shuffleCards(spiderDeck(suitCount), random);
  const tableau = Array.from({ length: 10 }, () => [] as Card[]);
  for (let pile = 0; pile < 10; pile++) {
    const count = pile < 4 ? 6 : 5;
    for (let index = 0; index < count; index++) {
      const card = deck.pop(); if (!card) throw new Error("Spider deal exhausted");
      tableau[pile].push({ ...card, faceUp: index === count - 1 });
    }
  }
  return { tableau, stock: deck, completed: [], suitCount, moves: 0, score: 500, complete: false };
}

function spiderRun(cards: Card[]): boolean { return cards.length > 0 && cards.every((card) => card.faceUp) && cards.slice(1).every((card, index) => card.suit === cards[index].suit && card.rank === cards[index].rank - 1); }
function resolveSpider(state: SpiderState): void {
  for (const pile of state.tableau) {
    while (pile.length >= 13) {
      const run = pile.slice(-13);
      if (run[0].rank !== 13 || run.at(-1)?.rank !== 1 || !spiderRun(run)) break;
      state.completed.push(pile.splice(-13)); state.score += 100;
      const top = pile.at(-1); if (top) top.faceUp = true;
    }
  }
  state.complete = state.completed.length === 8;
}

export function moveSpider(state: SpiderState, sourcePile: number, sourceIndex: number, targetPile: number): { state: SpiderState; moved: boolean } {
  if (state.complete || sourcePile === targetPile) return { state, moved: false };
  const moving = state.tableau[sourcePile]?.slice(sourceIndex) || [];
  const destination = state.tableau[targetPile];
  if (!destination || !spiderRun(moving)) return { state, moved: false };
  const top = destination.at(-1); if (top && top.rank !== moving[0].rank + 1) return { state, moved: false };
  const next: SpiderState = { ...state, tableau: state.tableau.map((pile) => pile.map(cloneCard)), stock: state.stock.map(cloneCard), completed: state.completed.map((run) => run.map(cloneCard)) };
  next.tableau[sourcePile].splice(sourceIndex, moving.length); next.tableau[targetPile].push(...moving.map(cloneCard));
  const exposed = next.tableau[sourcePile].at(-1); if (exposed) exposed.faceUp = true;
  next.moves++; next.score = Math.max(0, next.score - 1); resolveSpider(next);
  return { state: next, moved: true };
}

export function dealSpiderStock(state: SpiderState): { state: SpiderState; moved: boolean } {
  if (state.complete || state.stock.length < 10 || state.tableau.some((pile) => !pile.length)) return { state, moved: false };
  const next: SpiderState = { ...state, tableau: state.tableau.map((pile) => pile.map(cloneCard)), stock: state.stock.map(cloneCard), completed: state.completed.map((run) => run.map(cloneCard)) };
  for (const pile of next.tableau) { const card = next.stock.pop(); if (card) pile.push({ ...card, faceUp: true }); }
  next.moves++; next.score = Math.max(0, next.score - 1); resolveSpider(next);
  return { state: next, moved: true };
}

export function spiderHint(state: SpiderState): { sourcePile: number; sourceIndex: number; targetPile: number } | { draw: true } | null {
  for (let sourcePile = 0; sourcePile < 10; sourcePile++) for (let index = 0; index < state.tableau[sourcePile].length; index++) for (let targetPile = 0; targetPile < 10; targetPile++) if (moveSpider(state, sourcePile, index, targetPile).moved) return { sourcePile, sourceIndex: index, targetPile };
  return state.stock.length >= 10 && state.tableau.every((pile) => pile.length) ? { draw: true } : null;
}

export interface PyramidState { tableau: Array<Card | null>; stock: Card[]; waste: Card[]; removed: Card[]; moves: number; score: number; complete: boolean; }
const pyramidIndex = (row: number, column: number) => row * (row + 1) / 2 + column;
export function pyramidExposed(state: PyramidState, index: number): boolean {
  if (!state.tableau[index]) return false;
  let row = 0; while (pyramidIndex(row + 1, 0) <= index) row++;
  const column = index - pyramidIndex(row, 0);
  return row === 6 || (!state.tableau[pyramidIndex(row + 1, column)] && !state.tableau[pyramidIndex(row + 1, column + 1)]);
}

export function createPyramidGame(random: () => number = Math.random): PyramidState {
  const deck = shuffleKlondikeDeck(klondikeDeck(), random).map((card) => ({ ...card, faceUp: true }));
  return { tableau: deck.splice(0, 28), stock: deck, waste: [], removed: [], moves: 0, score: 0, complete: false };
}

export type PyramidPick = { zone: "tableau"; index: number } | { zone: "waste" };
const pyramidCard = (state: PyramidState, pick: PyramidPick): Card | null | undefined => pick.zone === "waste" ? state.waste.at(-1) : pyramidExposed(state, pick.index) ? state.tableau[pick.index] : null;
export function removePyramid(state: PyramidState, first: PyramidPick, second?: PyramidPick): { state: PyramidState; moved: boolean } {
  if (state.complete) return { state, moved: false };
  const a = pyramidCard(state, first); const b = second ? pyramidCard(state, second) : null;
  if (!a || (second && !b)) return { state, moved: false };
  if (second ? a.id === b!.id || a.rank + b!.rank !== 13 : a.rank !== 13) return { state, moved: false };
  const next: PyramidState = { ...state, tableau: state.tableau.map((card) => card ? cloneCard(card) : null), stock: state.stock.map(cloneCard), waste: state.waste.map(cloneCard), removed: state.removed.map(cloneCard) };
  for (const pick of second ? [first, second] : [first]) {
    const card = pick.zone === "waste" ? next.waste.pop() : next.tableau[pick.index];
    if (pick.zone === "tableau") next.tableau[pick.index] = null;
    if (card) next.removed.push(card);
  }
  next.moves++; next.score += second ? 20 : 10; next.complete = next.tableau.every((card) => !card);
  return { state: next, moved: true };
}
export function drawPyramid(state: PyramidState): { state: PyramidState; moved: boolean } {
  if (state.complete || !state.stock.length) return { state, moved: false };
  const next: PyramidState = { ...state, tableau: state.tableau.map((card) => card ? cloneCard(card) : null), stock: state.stock.map(cloneCard), waste: state.waste.map(cloneCard), removed: state.removed.map(cloneCard) };
  const card = next.stock.pop(); if (card) next.waste.push({ ...card, faceUp: true }); next.moves++; return { state: next, moved: true };
}
export function pyramidHint(state: PyramidState): [PyramidPick, PyramidPick?] | { draw: true } | null {
  const picks: PyramidPick[] = state.tableau.map((_, index) => ({ zone: "tableau" as const, index })).filter((pick) => pyramidExposed(state, pick.index));
  if (state.waste.length) picks.push({ zone: "waste" });
  for (const pick of picks) if (pyramidCard(state, pick)?.rank === 13) return [pick];
  for (let a = 0; a < picks.length; a++) for (let b = a + 1; b < picks.length; b++) if ((pyramidCard(state, picks[a])?.rank || 0) + (pyramidCard(state, picks[b])?.rank || 0) === 13) return [picks[a], picks[b]];
  return state.stock.length ? { draw: true } : null;
}

export interface TriPeaksState { tableau: Array<Card | null>; stock: Card[]; waste: Card[]; moves: number; streak: number; bestStreak: number; score: number; complete: boolean; }
const TRI_CHILDREN: Record<number, [number, number]> = { 0:[3,4],1:[5,6],2:[7,8],3:[9,10],4:[10,11],5:[12,13],6:[13,14],7:[15,16],8:[16,17],9:[18,19],10:[19,20],11:[20,21],12:[21,22],13:[22,23],14:[23,24],15:[24,25],16:[25,26],17:[26,27] };
export function triPeaksExposed(state: TriPeaksState, index: number): boolean { const card = state.tableau[index]; if (!card) return false; const children = TRI_CHILDREN[index]; return !children || (!state.tableau[children[0]] && !state.tableau[children[1]]); }
export function createTriPeaksGame(random: () => number = Math.random): TriPeaksState {
  const deck = shuffleKlondikeDeck(klondikeDeck(), random).map((card) => ({ ...card, faceUp: true }));
  const tableau = deck.splice(0, 28); const first = deck.pop();
  return { tableau, stock: deck, waste: first ? [first] : [], moves: 0, streak: 0, bestStreak: 0, score: 0, complete: false };
}
export function playTriPeaks(state: TriPeaksState, index: number): { state: TriPeaksState; moved: boolean } {
  const card = state.tableau[index]; const waste = state.waste.at(-1);
  if (state.complete || !card || !waste || !triPeaksExposed(state, index) || Math.abs(card.rank - waste.rank) !== 1) return { state, moved: false };
  const next: TriPeaksState = { ...state, tableau: state.tableau.map((item) => item ? cloneCard(item) : null), stock: state.stock.map(cloneCard), waste: state.waste.map(cloneCard) };
  const played = next.tableau[index]; next.tableau[index] = null; if (played) next.waste.push(played);
  next.moves++; next.streak++; next.bestStreak = Math.max(next.bestStreak, next.streak); next.score += 10 * next.streak; next.complete = next.tableau.every((item) => !item); return { state: next, moved: true };
}
export function drawTriPeaks(state: TriPeaksState): { state: TriPeaksState; moved: boolean } {
  if (state.complete || !state.stock.length) return { state, moved: false };
  const next: TriPeaksState = { ...state, tableau: state.tableau.map((item) => item ? cloneCard(item) : null), stock: state.stock.map(cloneCard), waste: state.waste.map(cloneCard) };
  const card = next.stock.pop(); if (card) next.waste.push(card); next.moves++; next.streak = 0; return { state: next, moved: true };
}
export function triPeaksHint(state: TriPeaksState): number | { draw: true } | null { for (let index = 0; index < 28; index++) if (playTriPeaks(state, index).moved) return index; return state.stock.length ? { draw: true } : null; }
