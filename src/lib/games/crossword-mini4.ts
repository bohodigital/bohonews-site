export type Mini4Direction = "across" | "down";

export interface Mini4Entry {
  number: number;
  direction: Mini4Direction;
  answer: string;
  clue: string;
}

export interface Mini4Puzzle {
  schemaVersion: 1;
  id: string;
  size: 4;
  grid: string;
  entries: Mini4Entry[];
  difficulty: "easy" | "medium" | "hard";
  fingerprint: string;
}

export interface Mini4LayoutEntry {
  answer: string;
  clue: string;
  orientation: Mini4Direction;
  position: number;
  startx: number;
  starty: number;
}

const SIZE = 4;
const ACROSS_NUMBERS = [1, 5, 6, 7];
const DOWN_NUMBERS = [1, 2, 3, 4];

function normalizeWord(value: string): string {
  return value.trim().toUpperCase();
}

export function expectedMini4Entries(grid: string): Array<Omit<Mini4Entry,"clue">> {
  const normalized = normalizeWord(grid);
  if (!/^[A-Z]{16}$/.test(normalized)) return [];
  const rows = Array.from({length:SIZE},(_,row)=>normalized.slice(row*SIZE,row*SIZE+SIZE));
  const columns = Array.from({length:SIZE},(_,column)=>rows.map((row)=>row[column]).join(""));
  return [
    ...rows.map((answer,index)=>({number:ACROSS_NUMBERS[index],direction:"across" as const,answer})),
    ...columns.map((answer,index)=>({number:DOWN_NUMBERS[index],direction:"down" as const,answer}))
  ];
}

export function validateMini4Puzzle(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["Puzzle must be an object"];
  const puzzle = value as Partial<Mini4Puzzle>;
  if (puzzle.schemaVersion !== 1) errors.push("Unsupported schema version");
  if (!/^mini4-[a-z0-9-]+$/.test(puzzle.id||"")) errors.push("Invalid puzzle ID");
  if (puzzle.size !== 4) errors.push("Puzzle must be 4x4");
  if (!/^[A-Z]{16}$/.test(puzzle.grid||"")) errors.push("Grid must contain sixteen uppercase letters");
  if (!/^[a-z0-9-]{8,80}$/.test(puzzle.fingerprint||"")) errors.push("Invalid fingerprint");
  if (!Array.isArray(puzzle.entries) || puzzle.entries.length !== 8) errors.push("Puzzle must contain eight entries");
  const expected = expectedMini4Entries(puzzle.grid||"");
  if (expected.length && Array.isArray(puzzle.entries)) {
    const answers = puzzle.entries.map((entry)=>entry?.answer);
    if (new Set(answers).size !== 8) errors.push("Across and Down answers must be distinct");
    expected.forEach((entry)=>{
      const actual=puzzle.entries?.find((candidate)=>candidate?.number===entry.number&&candidate?.direction===entry.direction);
      if (!actual) errors.push(`Missing ${entry.number} ${entry.direction}`);
      else {
        if (actual.answer!==entry.answer) errors.push(`Wrong answer for ${entry.number} ${entry.direction}`);
        if (typeof actual.clue!=="string"||actual.clue.trim().length<2||actual.clue.length>100) errors.push(`Invalid clue for ${entry.number} ${entry.direction}`);
      }
    });
  }
  return errors;
}

export function createMini4Puzzle(id: string, rows: string[], clues: Record<string,string>, difficulty: "easy"|"medium"|"hard" = "easy"): Mini4Puzzle {
  if (rows.length!==SIZE||rows.some((row)=>!/^[a-z]{4}$/.test(row))) throw new TypeError("Mini fill must contain four lowercase four-letter rows");
  const grid=rows.join("").toUpperCase();
  const entries=expectedMini4Entries(grid).map((entry)=>{
    const clue=clues[entry.answer.toLowerCase()];
    if (!clue) throw new Error(`Missing clue for ${entry.answer}`);
    return {...entry,clue};
  });
  const puzzle:Mini4Puzzle={schemaVersion:1,id,size:4,grid,entries,difficulty,fingerprint:`${id}-${grid.toLowerCase()}`};
  const errors=validateMini4Puzzle(puzzle);if(errors.length)throw new Error(errors.join("; "));
  return puzzle;
}

export function mini4ToLayout(puzzle: Mini4Puzzle): {rows:4;cols:4;table:string[][];result:Mini4LayoutEntry[]} {
  const errors=validateMini4Puzzle(puzzle);if(errors.length)throw new TypeError(errors.join("; "));
  const table=Array.from({length:SIZE},(_,row)=>puzzle.grid.slice(row*SIZE,row*SIZE+SIZE).toLowerCase().split(""));
  const result=puzzle.entries.map((entry)=>({
    answer:entry.answer.toLowerCase(),clue:entry.clue,orientation:entry.direction,position:entry.number,
    startx:entry.direction==="across"?1:entry.number,starty:entry.direction==="across"?(entry.number===1?1:entry.number-3):1
  }));
  return {rows:4,cols:4,table,result};
}

export function solveMini4Fills(values: string[], limit=100): string[][] {
  const words=[...new Set(values.map((word)=>word.toLowerCase()).filter((word)=>/^[a-z]{4}$/.test(word)))];
  const wordSet=new Set(words);const prefixes=new Set<string>([""]);
  words.forEach((word)=>{for(let length=1;length<=SIZE;length++)prefixes.add(word.slice(0,length));});
  const fills:string[][]=[];
  function visit(rows:string[]){
    if(fills.length>=limit)return;
    if(rows.length===SIZE){const columns=Array.from({length:SIZE},(_,column)=>rows.map((row)=>row[column]).join(""));if(columns.every((word)=>wordSet.has(word))&&new Set([...rows,...columns]).size===8)fills.push([...rows]);return;}
    const columnPrefixes=Array.from({length:SIZE},(_,column)=>rows.map((row)=>row[column]).join(""));
    for(const word of words){if(rows.includes(word))continue;if(columnPrefixes.every((prefix,column)=>prefixes.has(prefix+word[column])))visit([...rows,word]);if(fills.length>=limit)return;}
  }
  visit([]);return fills;
}
