export const KLONDIKE_SUITS = ["clubs", "diamonds", "hearts", "spades"] as const;
export type KlondikeSuit = typeof KLONDIKE_SUITS[number];
export type KlondikeDrawCount = 1 | 3;

export interface KlondikeCard {
  id: string;
  suit: KlondikeSuit;
  rank: number;
  faceUp: boolean;
}

export interface KlondikeState {
  stock: KlondikeCard[];
  waste: KlondikeCard[];
  foundations: Record<KlondikeSuit, KlondikeCard[]>;
  tableau: KlondikeCard[][];
  drawCount: KlondikeDrawCount;
  score: number;
  moves: number;
  recycles: number;
  complete: boolean;
}

export type KlondikeSource =
  | { zone: "waste" }
  | { zone: "foundation"; suit: KlondikeSuit }
  | { zone: "tableau"; pile: number; index: number };

export type KlondikeTarget =
  | { zone: "foundation"; suit: KlondikeSuit }
  | { zone: "tableau"; pile: number };

export interface KlondikeMoveResult {
  state: KlondikeState;
  moved: boolean;
  flipped: boolean;
  scoreDelta: number;
}

const SUIT_CODE: Record<KlondikeSuit, string> = { clubs: "C", diamonds: "D", hearts: "H", spades: "S" };

function emptyFoundations(): Record<KlondikeSuit, KlondikeCard[]> {
  return { clubs: [], diamonds: [], hearts: [], spades: [] };
}

export function klondikeDeck(): KlondikeCard[] {
  return KLONDIKE_SUITS.flatMap((suit) => Array.from({ length: 13 }, (_, index) => ({
    id: `${SUIT_CODE[suit]}${index + 1}`,
    suit,
    rank: index + 1,
    faceUp: false
  })));
}

function safeRandom(random: () => number): number {
  const value = random();
  return Number.isFinite(value) ? Math.min(0.999999999999, Math.max(0, value)) : 0;
}

export function shuffleKlondikeDeck(cards: KlondikeCard[], random: () => number = Math.random): KlondikeCard[] {
  const shuffled = cards.map((card) => ({ ...card, faceUp: false }));
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swap = Math.floor(safeRandom(random) * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

export function createKlondikeGame(random: () => number = Math.random, drawCount: KlondikeDrawCount = 1): KlondikeState {
  if (drawCount !== 1 && drawCount !== 3) throw new TypeError("Klondike draw count must be one or three");
  const deck = shuffleKlondikeDeck(klondikeDeck(), random);
  const tableau: KlondikeCard[][] = Array.from({ length: 7 }, () => []);
  for (let row = 0; row < 7; row++) {
    for (let pile = row; pile < 7; pile++) {
      const card = deck.pop();
      if (!card) throw new Error("Klondike deck ended during the deal");
      tableau[pile].push({ ...card, faceUp: row === pile });
    }
  }
  return {
    stock: deck,
    waste: [],
    foundations: emptyFoundations(),
    tableau,
    drawCount,
    score: 0,
    moves: 0,
    recycles: 0,
    complete: false
  };
}

export function cloneKlondikeState(state: KlondikeState): KlondikeState {
  return {
    ...state,
    stock: state.stock.map((card) => ({ ...card })),
    waste: state.waste.map((card) => ({ ...card })),
    foundations: Object.fromEntries(KLONDIKE_SUITS.map((suit) => [suit, state.foundations[suit].map((card) => ({ ...card }))])) as Record<KlondikeSuit, KlondikeCard[]>,
    tableau: state.tableau.map((pile) => pile.map((card) => ({ ...card })))
  };
}

export function klondikeCardColor(card: Pick<KlondikeCard, "suit">): "red" | "black" {
  return card.suit === "diamonds" || card.suit === "hearts" ? "red" : "black";
}

export function canPlaceKlondikeTableau(card: KlondikeCard, destination?: KlondikeCard): boolean {
  if (!card.faceUp) return false;
  if (!destination) return card.rank === 13;
  return destination.faceUp && destination.rank === card.rank + 1 && klondikeCardColor(destination) !== klondikeCardColor(card);
}

export function canPlaceKlondikeFoundation(card: KlondikeCard, pile: KlondikeCard[], suit: KlondikeSuit): boolean {
  if (!card.faceUp || card.suit !== suit) return false;
  const top = pile.at(-1);
  return top ? card.rank === top.rank + 1 : card.rank === 1;
}

function validCard(value: unknown): value is KlondikeCard {
  if (!value || typeof value !== "object") return false;
  const card = value as KlondikeCard;
  return KLONDIKE_SUITS.includes(card.suit) && Number.isInteger(card.rank) && card.rank >= 1 && card.rank <= 13
    && card.id === `${SUIT_CODE[card.suit]}${card.rank}` && typeof card.faceUp === "boolean";
}

export function isValidKlondikeState(value: unknown): value is KlondikeState {
  if (!value || typeof value !== "object") return false;
  const state = value as KlondikeState;
  if (!Array.isArray(state.stock) || !Array.isArray(state.waste) || !Array.isArray(state.tableau) || state.tableau.length !== 7) return false;
  if (!state.foundations || typeof state.foundations !== "object" || (state.drawCount !== 1 && state.drawCount !== 3)) return false;
  if (![state.score, state.moves, state.recycles].every((entry) => Number.isInteger(entry) && entry >= 0) || typeof state.complete !== "boolean") return false;
  const foundationPiles = KLONDIKE_SUITS.map((suit) => state.foundations[suit]);
  if (foundationPiles.some((pile) => !Array.isArray(pile))) return false;
  const all = [...state.stock, ...state.waste, ...foundationPiles.flat(), ...state.tableau.flat()];
  if (all.length !== 52 || all.some((card) => !validCard(card)) || new Set(all.map((card) => card.id)).size !== 52) return false;
  if (state.stock.some((card) => card.faceUp) || state.waste.some((card) => !card.faceUp)) return false;
  if (KLONDIKE_SUITS.some((suit) => state.foundations[suit].some((card, index) => !card.faceUp || card.suit !== suit || card.rank !== index + 1))) return false;
  if (state.tableau.some((pile) => {
    const firstUp = pile.findIndex((card) => card.faceUp);
    if (pile.length && firstUp < 0) return true;
    if (firstUp < 0) return false;
    const faceUp = pile.slice(firstUp);
    return faceUp.some((card) => !card.faceUp) || faceUp.slice(1).some((card, index) => !canPlaceKlondikeTableau(card, faceUp[index]));
  })) return false;
  return state.complete === (foundationPiles.reduce((sum, pile) => sum + pile.length, 0) === 52);
}

function revealTableauTop(state: KlondikeState, pileIndex: number): boolean {
  const top = state.tableau[pileIndex]?.at(-1);
  if (!top || top.faceUp) return false;
  top.faceUp = true;
  state.score += 5;
  return true;
}

function sourceCards(state: KlondikeState, source: KlondikeSource): KlondikeCard[] | null {
  if (source.zone === "waste") {
    const card = state.waste.at(-1);
    return card ? [card] : null;
  }
  if (source.zone === "foundation") {
    const card = state.foundations[source.suit]?.at(-1);
    return card ? [card] : null;
  }
  const pile = state.tableau[source.pile];
  if (!pile || !Number.isInteger(source.index) || source.index < 0 || source.index >= pile.length) return null;
  const cards = pile.slice(source.index);
  return cards.length && cards.every((card) => card.faceUp) ? cards : null;
}

function removeSource(state: KlondikeState, source: KlondikeSource, count: number): void {
  if (source.zone === "waste") state.waste.pop();
  else if (source.zone === "foundation") state.foundations[source.suit].pop();
  else state.tableau[source.pile].splice(source.index, count);
}

export function moveKlondike(state: KlondikeState, source: KlondikeSource, target: KlondikeTarget): KlondikeMoveResult {
  if (!isValidKlondikeState(state) || state.complete) return { state, moved: false, flipped: false, scoreDelta: 0 };
  const moving = sourceCards(state, source);
  if (!moving) return { state, moved: false, flipped: false, scoreDelta: 0 };
  if (source.zone === "tableau" && target.zone === "tableau" && source.pile === target.pile) return { state, moved: false, flipped: false, scoreDelta: 0 };
  if (target.zone === "foundation") {
    if (moving.length !== 1 || !canPlaceKlondikeFoundation(moving[0], state.foundations[target.suit], target.suit)) return { state, moved: false, flipped: false, scoreDelta: 0 };
  } else {
    const destination = state.tableau[target.pile];
    if (!destination || !canPlaceKlondikeTableau(moving[0], destination.at(-1))) return { state, moved: false, flipped: false, scoreDelta: 0 };
  }

  const next = cloneKlondikeState(state);
  const before = next.score;
  removeSource(next, source, moving.length);
  const movedCards = moving.map((card) => ({ ...card }));
  if (target.zone === "foundation") next.foundations[target.suit].push(movedCards[0]);
  else next.tableau[target.pile].push(...movedCards);

  if (target.zone === "foundation") next.score += 10;
  else if (source.zone === "waste") next.score += 5;
  else if (source.zone === "foundation") next.score = Math.max(0, next.score - 15);
  const flipped = source.zone === "tableau" ? revealTableauTop(next, source.pile) : false;
  next.moves++;
  next.complete = KLONDIKE_SUITS.every((suit) => next.foundations[suit].length === 13);
  return { state: next, moved: true, flipped, scoreDelta: next.score - before };
}

export function drawKlondike(state: KlondikeState): KlondikeMoveResult {
  if (!isValidKlondikeState(state) || state.complete) return { state, moved: false, flipped: false, scoreDelta: 0 };
  if (!state.stock.length && !state.waste.length) return { state, moved: false, flipped: false, scoreDelta: 0 };
  const next = cloneKlondikeState(state);
  const before = next.score;
  if (next.stock.length) {
    const count = Math.min(next.drawCount, next.stock.length);
    for (let index = 0; index < count; index++) {
      const card = next.stock.pop();
      if (card) next.waste.push({ ...card, faceUp: true });
    }
  } else {
    next.stock = next.waste.reverse().map((card) => ({ ...card, faceUp: false }));
    next.waste = [];
    next.recycles++;
    if (next.drawCount === 3) next.score = Math.max(0, next.score - 20);
  }
  next.moves++;
  return { state: next, moved: true, flipped: false, scoreDelta: next.score - before };
}

export function klondikeHint(state: KlondikeState): { source: KlondikeSource; target: KlondikeTarget } | { draw: true } | null {
  if (!isValidKlondikeState(state) || state.complete) return null;
  const sources: KlondikeSource[] = [];
  if (state.waste.length) sources.push({ zone: "waste" });
  state.tableau.forEach((pile, pileIndex) => {
    const firstUp = pile.findIndex((card) => card.faceUp);
    if (firstUp >= 0) sources.push({ zone: "tableau", pile: pileIndex, index: firstUp });
  });
  for (const source of sources) {
    const moving = sourceCards(state, source);
    if (!moving) continue;
    if (moving.length === 1) {
      const target = { zone: "foundation", suit: moving[0].suit } as const;
      if (canPlaceKlondikeFoundation(moving[0], state.foundations[target.suit], target.suit)) return { source, target };
    }
  }
  for (const source of sources) {
    const moving = sourceCards(state, source);
    if (!moving) continue;
    for (let pile = 0; pile < 7; pile++) {
      if (source.zone === "tableau" && source.pile === pile) continue;
      if (canPlaceKlondikeTableau(moving[0], state.tableau[pile].at(-1))) return { source, target: { zone: "tableau", pile } };
    }
  }
  return state.stock.length || state.waste.length ? { draw: true } : null;
}

export function klondikeRankLabel(rank: number): string {
  return rank === 1 ? "A" : rank === 11 ? "J" : rank === 12 ? "Q" : rank === 13 ? "K" : String(rank);
}

export function klondikeSuitSymbol(suit: KlondikeSuit): string {
  return suit === "clubs" ? "♣" : suit === "diamonds" ? "♦" : suit === "hearts" ? "♥" : "♠";
}
