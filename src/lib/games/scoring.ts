export interface GameTimer {
  elapsedMs: number;
  runningSince: number | null;
  finishedMs: number | null;
  eligible: boolean;
}

const MAX_POINTS = Number.MAX_SAFE_INTEGER;

export function createGameTimer(now = Date.now()): GameTimer {
  return { elapsedMs: 0, runningSince: now, finishedMs: null, eligible: true };
}

export function isGameTimer(value: unknown): value is GameTimer {
  if (!value || typeof value !== "object") return false;
  const timer = value as GameTimer;
  return Number.isFinite(timer.elapsedMs) && timer.elapsedMs >= 0
    && (timer.runningSince === null || Number.isFinite(timer.runningSince))
    && (timer.finishedMs === null || Number.isFinite(timer.finishedMs))
    && typeof timer.eligible === "boolean";
}

export function normalizeGameTimer(value: unknown, complete: boolean, now = Date.now()): GameTimer {
  if (!isGameTimer(value)) {
    return complete
      ? { elapsedMs: 0, runningSince: null, finishedMs: null, eligible: false }
      : createGameTimer(now);
  }
  const timer = { ...value };
  if (complete) {
    if (timer.runningSince !== null) timer.elapsedMs += Math.max(0, now - timer.runningSince);
    timer.runningSince = null;
    timer.finishedMs ??= timer.elapsedMs;
  }
  return timer;
}

export function elapsedGameMs(timer: GameTimer, now = Date.now()): number {
  if (timer.finishedMs !== null) return timer.finishedMs;
  return timer.elapsedMs + (timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince));
}

export function pauseGameTimer(timer: GameTimer, now = Date.now()): GameTimer {
  if (timer.runningSince !== null && timer.finishedMs === null) {
    timer.elapsedMs += Math.max(0, now - timer.runningSince);
    timer.runningSince = null;
  }
  return timer;
}

export function resumeGameTimer(timer: GameTimer, now = Date.now()): GameTimer {
  if (timer.eligible && timer.finishedMs === null && timer.runningSince === null) timer.runningSince = now;
  return timer;
}

export function finishGameTimer(timer: GameTimer, now = Date.now()): GameTimer {
  pauseGameTimer(timer, now);
  if (timer.eligible) timer.finishedMs = timer.elapsedMs;
  return timer;
}

export function formatGameTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function safePoints(value: number): number {
  if (!Number.isFinite(value)) return MAX_POINTS;
  return Math.max(0, Math.min(MAX_POINTS, Math.floor(value)));
}

function seconds(milliseconds: number): number {
  return Math.max(0.001, milliseconds / 1000);
}

export function wordlePoints({ won, guesses, elapsedMs }: { won: boolean; guesses: number; elapsedMs: number }): number {
  if (!won) return 0;
  const tries = Math.max(1, Math.min(6, Math.floor(guesses)));
  const guessScore = 7000 - tries * 1000;
  const speedBonus = 2000 * 120 / (120 + seconds(elapsedMs));
  return safePoints(guessScore + speedBonus);
}

const RARE_LETTER_WEIGHT: Record<string, number> = { Q: 4, Z: 4, J: 3, X: 3, K: 2, V: 2, W: 1, Y: 1 };

export function miniPerfectSeconds(answers: string[]): number {
  const normalized = answers.map((answer) => answer.toUpperCase()).filter(Boolean);
  const uniqueCells = normalized[0]?.length ? normalized[0].length * Math.max(1, normalized.length / 2) : 16;
  const rarity = normalized.reduce((sum, answer) => sum + [...answer].reduce((letterSum, letter) => letterSum + (RARE_LETTER_WEIGHT[letter] || 0), 0), 0);
  return Math.round(20 + uniqueCells * 2 + normalized.length * 5 + rarity * 1.5);
}

export function miniCrosswordPoints({ elapsedMs, perfectSeconds, failedChecks = 0 }: { elapsedMs: number; perfectSeconds: number; failedChecks?: number }): number {
  // The P/t term is intentionally asymptotic: mathematically, score is unbounded as t approaches zero.
  const speedScore = 4000 * Math.max(1, perfectSeconds) / seconds(elapsedMs);
  return safePoints(4000 + speedScore - Math.max(0, failedChecks) * 600);
}

const SUDOKU_RULES = {
  easy: { base: 2500, par: 360, penalty: 250 },
  medium: { base: 4000, par: 600, penalty: 400 },
  hard: { base: 6000, par: 900, penalty: 600 },
  expert: { base: 8500, par: 1200, penalty: 850 }
} as const;

export type SudokuDifficulty = keyof typeof SUDOKU_RULES;

export function sudokuPoints({ difficulty, elapsedMs, failedChecks = 0 }: { difficulty: SudokuDifficulty; elapsedMs: number; failedChecks?: number }): number {
  const rule = SUDOKU_RULES[difficulty];
  const speedBonus = rule.base * rule.par / (rule.par + seconds(elapsedMs));
  return safePoints(rule.base + speedBonus - Math.max(0, failedChecks) * rule.penalty);
}

export function mahjongPoints({ elapsedMs, hints = 0 }: { elapsedMs: number; hints?: number }): number {
  const base = 7200;
  const speedBonus = base * 600 / (600 + seconds(elapsedMs));
  return safePoints(base + speedBonus - Math.max(0, hints) * 500);
}

export function solitairePoints({ won, drawCount, moveScore, elapsedMs, hints = 0 }: { won: boolean; drawCount: 1 | 3; moveScore: number; elapsedMs: number; hints?: number }): number {
  if (!won) return 0;
  const difficulty = drawCount === 3 ? 1.2 : 1;
  const base = 6000 * difficulty;
  const speedBonus = base * 600 / (600 + seconds(elapsedMs));
  return safePoints(base + speedBonus + Math.max(0, moveScore) * 2 - Math.max(0, hints) * 300);
}

export function freeCellPoints({ won, moves, elapsedMs, hints = 0 }: { won: boolean; moves: number; elapsedMs: number; hints?: number }): number {
  if (!won) return 0;
  const base = 8500;
  const speedBonus = base * 480 / (480 + seconds(elapsedMs));
  const efficiencyBonus = Math.max(0, 2500 - Math.max(0, moves - 52) * 20);
  return safePoints(base + speedBonus + efficiencyBonus - Math.max(0, hints) * 350);
}

export function spiderPoints({ won, suits, moveScore, elapsedMs, hints = 0 }: { won: boolean; suits: 1 | 2 | 4; moveScore: number; elapsedMs: number; hints?: number }): number {
  if (!won) return 0;
  const multiplier = suits === 4 ? 2.4 : suits === 2 ? 1.55 : 1;
  const base = 9000 * multiplier;
  const speedBonus = base * 900 / (900 + seconds(elapsedMs));
  return safePoints(base + speedBonus + Math.max(0, moveScore) * 3 - Math.max(0, hints) * 450);
}

export function pyramidPoints({ won, moveScore, elapsedMs, hints = 0 }: { won: boolean; moveScore: number; elapsedMs: number; hints?: number }): number {
  if (!won) return 0;
  const base = 5500;
  const speedBonus = base * 240 / (240 + seconds(elapsedMs));
  return safePoints(base + speedBonus + Math.max(0, moveScore) * 5 - Math.max(0, hints) * 250);
}

export function triPeaksPoints({ won, moveScore, bestStreak, elapsedMs, hints = 0 }: { won: boolean; moveScore: number; bestStreak: number; elapsedMs: number; hints?: number }): number {
  if (!won) return 0;
  const base = 6000;
  const speedBonus = base * 210 / (210 + seconds(elapsedMs));
  return safePoints(base + speedBonus + Math.max(0, moveScore) * 3 + Math.max(0, bestStreak) * 150 - Math.max(0, hints) * 250);
}

export function nonogramPoints({ rows, cols, elapsedMs, usedSolve = false }: { rows: number; cols: number; elapsedMs: number; usedSolve?: boolean }): number {
  if (usedSolve) return 0;
  const area = Math.max(25, Math.floor(rows) * Math.floor(cols));
  const base = area * 40;
  const par = area * 2;
  const speedBonus = base * par / (par + seconds(elapsedMs));
  return safePoints(base + speedBonus);
}

const MINESWEEPER_RULES = {
  beginner: { base: 2500, par: 60 },
  intermediate: { base: 6500, par: 240 },
  expert: { base: 12000, par: 480 }
} as const;

export type MinesweeperDifficulty = keyof typeof MINESWEEPER_RULES | "custom";

export function minesweeperPoints({ difficulty, rows, cols, mines, elapsedMs, failed = false, practice = false }: { difficulty: MinesweeperDifficulty; rows: number; cols: number; mines: number; elapsedMs: number; failed?: boolean; practice?: boolean }): number {
  if (failed || practice) return 0;
  const cells = Math.max(9, Math.floor(rows) * Math.floor(cols));
  const mineCount = Math.max(1, Math.min(cells - 1, Math.floor(mines)));
  const customBase = Math.max(2000, Math.min(20000, (cells - mineCount + mineCount * 2) * 25));
  const rule = difficulty === "custom"
    ? { base: customBase, par: Math.max(30, (cells - mineCount) * 0.9) }
    : MINESWEEPER_RULES[difficulty];
  const speedBonus = rule.base * rule.par / (rule.par + seconds(elapsedMs));
  return safePoints(rule.base + speedBonus);
}

export function connectionsPoints({ won, mistakes, elapsedMs }: { won: boolean; mistakes: number; elapsedMs: number }): number {
  if (!won) return 0;
  const base = 7000;
  const speedBonus = 3000 * 180 / (180 + seconds(elapsedMs));
  return safePoints(base + speedBonus - Math.max(0, Math.min(3, Math.floor(mistakes))) * 900);
}

const LOOPY_RULES = {
  easy: { cellPoints: 50, secondsPerCell: 2.5 },
  normal: { cellPoints: 65, secondsPerCell: 4 },
  tricky: { cellPoints: 80, secondsPerCell: 6 },
  hard: { cellPoints: 100, secondsPerCell: 8 }
} as const;

export type LoopyDifficulty = keyof typeof LOOPY_RULES;

export function loopyPoints({ rows, cols, difficulty, elapsedMs, usedSolve = false }: { rows: number; cols: number; difficulty: LoopyDifficulty; elapsedMs: number; usedSolve?: boolean }): number {
  if (usedSolve) return 0;
  const area = Math.max(25, Math.floor(rows) * Math.floor(cols));
  const rule = LOOPY_RULES[difficulty];
  const base = area * rule.cellPoints;
  const par = area * rule.secondsPerCell;
  const speedBonus = base * par / (par + seconds(elapsedMs));
  return safePoints(base + speedBonus);
}

export type PointsBucket = "0" | "1-1999" | "2000-3999" | "4000-7999" | "8000-15999" | "16000+";

export function pointsBucket(points: number): PointsBucket {
  if (points <= 0) return "0";
  if (points < 2000) return "1-1999";
  if (points < 4000) return "2000-3999";
  if (points < 8000) return "4000-7999";
  if (points < 16000) return "8000-15999";
  return "16000+";
}
