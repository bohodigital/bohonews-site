export type Direction2048 = "up" | "right" | "down" | "left";

export interface Move2048Result {
  grid: number[];
  moved: boolean;
  gained: number;
  reached2048: boolean;
}

const SIZE = 4;
const CELLS = SIZE * SIZE;

export function createEmpty2048Grid(): number[] {
  return Array(CELLS).fill(0);
}

export function isValid2048Grid(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === CELLS && value.every((tile) =>
    Number.isSafeInteger(tile) && tile >= 0 && (tile === 0 || Number.isInteger(Math.log2(tile)))
  );
}

function safeRandom(random: () => number): number {
  const value = random();
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.999999999999) : 0;
}

export function spawn2048Tile(grid: number[], random: () => number = Math.random): number[] {
  if (!isValid2048Grid(grid)) throw new TypeError("2048 grid must contain sixteen powers of two or zero");
  const empty = grid.flatMap((tile, index) => tile === 0 ? [index] : []);
  if (!empty.length) return [...grid];
  const next = [...grid];
  const index = empty[Math.floor(safeRandom(random) * empty.length)];
  next[index] = safeRandom(random) < 0.9 ? 2 : 4;
  return next;
}

export function create2048Grid(random: () => number = Math.random): number[] {
  return spawn2048Tile(spawn2048Tile(createEmpty2048Grid(), random), random);
}

function mergeLine(line: number[]): { line: number[]; gained: number } {
  const compact = line.filter(Boolean);
  const merged: number[] = [];
  let gained = 0;
  for (let index = 0; index < compact.length; index++) {
    if (compact[index] === compact[index + 1]) {
      const value = compact[index] * 2;
      merged.push(value);
      gained += value;
      index++;
    } else {
      merged.push(compact[index]);
    }
  }
  return { line: [...merged, ...Array(SIZE - merged.length).fill(0)], gained };
}

function lineIndices(direction: Direction2048, line: number): number[] {
  if (direction === "left") return [0, 1, 2, 3].map((column) => line * SIZE + column);
  if (direction === "right") return [3, 2, 1, 0].map((column) => line * SIZE + column);
  if (direction === "up") return [0, 1, 2, 3].map((row) => row * SIZE + line);
  return [3, 2, 1, 0].map((row) => row * SIZE + line);
}

export function move2048(grid: number[], direction: Direction2048): Move2048Result {
  if (!isValid2048Grid(grid)) throw new TypeError("2048 grid must contain sixteen powers of two or zero");
  const next = [...grid];
  let gained = 0;
  for (let line = 0; line < SIZE; line++) {
    const indices = lineIndices(direction, line);
    const result = mergeLine(indices.map((index) => grid[index]));
    gained += result.gained;
    indices.forEach((index, offset) => { next[index] = result.line[offset]; });
  }
  return {
    grid: next,
    moved: next.some((tile, index) => tile !== grid[index]),
    gained,
    reached2048: next.some((tile) => tile >= 2048)
  };
}

export function canMove2048(grid: number[]): boolean {
  if (!isValid2048Grid(grid)) return false;
  if (grid.includes(0)) return true;
  return (["up", "right", "down", "left"] as Direction2048[]).some((direction) => move2048(grid, direction).moved);
}

export function max2048Tile(grid: number[]): number {
  return isValid2048Grid(grid) ? Math.max(...grid) : 0;
}

export function scoreBucket2048(maxTile: number): "<512" | "512" | "1024" | "2048" | "4096+" {
  if (maxTile >= 4096) return "4096+";
  if (maxTile >= 2048) return "2048";
  if (maxTile >= 1024) return "1024";
  if (maxTile >= 512) return "512";
  return "<512";
}
